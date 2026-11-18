// CHARS

// TOKENS

// PARSER

// BUILTINS

// GRAPHICS

// EXEC

//////////////////////////////////////////

// CHARS
var line, column

class Characterizer {
  constructor(code) {
    this.lines = code.split("\n")
    line = 0
    column = 0
  }

  peek(checkForComment = true) {
    if (this.eof()) return null

    if (checkForComment)
      return this.checkForComment(this.lines[line].length > column ? this.lines[line].charAt(column) : "\n")
    else
      return this.lines[line].length > column ? this.lines[line].charAt(column) : "\n"
  }
  checkForComment(char) {
    if (char === "/" && this.lines[line].charAt(column + 1) === "/")
      while ((char = this.peek(false)) !== "\n") { this.next(false) }

    return char
  }

  next(checkForComment = true) {
    var char = this.peek(checkForComment)

    if (char === "\n") {
      line++
      column = 0
    } else column++

    return char
  }

  eof() {
    var blankEndLines = 0

    for (let i = this.lines.length - 1; i >= 0; i--) {
      if (this.lines[i].trim().length) break

      blankEndLines++
    }

    var lastLine = this.lines.length - 1 - blankEndLines

    return line > lastLine || (line >= lastLine && this.lines[this.lines.length - blankEndLines - 1].length <= column)
  }
}

function error(msg, isWarn = false, fromExec = false) {
  var lineNums = `line ${line + 1} column ${column}: `,
      preText = `${isWarn ? "WARNING" : "ERROR"}: ${fromExec ? "" : lineNums}`

  if (isWarn) consoleMsg(preText + msg.replace("<", "&lt;"), "warn")
  else throw preText + msg.replace("<", "&lt;")
}

function log(msg) {
  if (typeof msg !== "string") msg = String(msg)

  msg = msg.replaceAll("<", "&lt;").replaceAll(">", "&gt;")

  if (msg === "") msg = "<i>[Empty string]</i>"
  else if (msg === "\n") msg = "<i>[New line]</i>"
  consoleMsg(msg, "log")
}

// TOKENS
// TOKEN TYPES: punc, string, number, operator, keyword, identifier

const keywords = [
  "if", "elif", "else", "or", "loop", "end",
  "function", "fn", "cache", "return", "env", "this",
  "const", "true", "false", "null",
  "class", "extends", "with", "get", "set", "static"
], unimplementedKeywords = ["for", "while", "in"]

class Tokenizer {
  constructor(ch) {
    this.ch = ch
  }

  _newLine = false
  sawSpace = false

  peek() {
    if (this.current) return this.current
    else return this.current = this.nextTok()
  }

  next() {
    var tok = this.peek()

    this.current = null

    var char = this.ch.peek()
    while (char === " ") {
      this.ch.next()

      char = this.ch.peek()
    }

    return tok
  }

  eof() {
    return !this.current?.type && this.ch.eof()
  }

  get newLine() {
    if (!this.current) this.peek()

    return this._newLine
  }

  nextTok() {
    this._newLine = false

    var char = this.skipSpaces(this.ch.next())

    if (char) {
      if ("()[]{},:;@".includes(char)) return this.formatReturn("punc", char)
      else if ("=+-*/^><&|^%!.?~".includes(char)) return this.parseOp(char)
      else if (/[A-Za-z_]/.test(char)) return this.parseIdentifier(char)
      else if (char === "\"" || char === "'") return this.parseString(char)
      else if (/\d/.test(char)) return this.parseNumber(char)
      else error(`Invalid character '${char}'`)
    }

    return this.formatReturn(null, null)
  }

  skipSpaces(char) {
    while (char === " " || char === "\n") {
      this._newLine ||= char === "\n"

      char = this.ch.next()
    }

    return char
  }

  formatReturn(type, value) {
    var spaceBefore = this.sawSpace

    this.sawSpace = this.ch.peek() === " " || this.ch.peek() === "\n"

    return {
      type : type,
      value : value,
      spaceBefore : spaceBefore
    }
  }

  parseOp(char) {
    var nextChar = this.ch.peek()

    if ("~!><+-*/^%&|=".includes(char) && nextChar === "=")
      return this.formatReturn("operator", char + this.ch.next())
    else if ("+-*&|^?.".includes(char) && nextChar === char) {
      this.ch.next()
      if (("*&|^?.".includes(char)) && this.ch.peek() === "=")
        return this.formatReturn("operator", char + nextChar + this.ch.next())

      return this.formatReturn("operator", char + nextChar)
    }

    return this.formatReturn("operator", char)
  }

  parseString(stringType) {
    var string = ""

    var char = this.ch.next(false)
    while (char !== stringType || string.slice(-1) === "\\") {
      if (!char || char === "\n") {
        var errorStr = string
        if (errorStr.length > 60) errorStr = string.slice(0, 40) + "..." + string.slice(-17)

        error(`Unterminated string "${errorStr}".`)
      }

      if (string.slice(-1) === "\\") string = string.slice(0, -1)

      string += char

      char = this.ch.next(false)
    }

    return this.formatReturn("string", string)
  }

  parseIdentifier(char) {
    var identifier = char

    var ch = this.ch.peek()
    while (ch && /\w/.test(ch)) {
      identifier += this.ch.next()

      ch = this.ch.peek()
    }

    if (unimplementedKeywords.includes(identifier))
      error(`The keyword '${identifier}' is reserved.`)

    return this.formatReturn(keywords.includes(identifier) ? "keyword" : "identifier", identifier)
  }

  parseNumber(char) {
    var number = char, canHaveDot = true

    var ch = this.ch.peek()
    while (/[\d]/.test(ch) || ch === "." && canHaveDot) {
      number += this.ch.next()

      if (ch === ".") canHaveDot = false

      ch = this.ch.peek()
    }
    return this.formatReturn("number", parseFloat(number))
  }
}

// PARSER
const operatorPrecedence = {
  // ~
  "." : 18, ":" : 18, "[" : 18,
  "(" : 16,
  "!" : 15,
  "**" : 14,
  "*" : 13, "/" : 13, "%" : 13,
  "+" : 12, "-" : 12,
  ".." : 11,
  "<" : 10, ">" : 10, "<=" : 10, ">=" : 10,
  "==" : 9, "!=" : 9,
  "&" : 8,
  "^" : 7,
  "|" : 6,
  "&&" : 5,
  "||" : 4, "??" : 4,
  // "?" : 3,
  "=" : 2, "+=" : 2, "-=" : 2, "*=" : 2, "/=" : 2, "^=" : 2, "%=" : 2, "&=" : 2, "|=" : 2, "&&=" : 2, "||=" : 2, "**=" : 2, "??=" : 2
}
const rightToLeftOperators = [2, 3, 14],
      prefixOperators = ["!", "$", "~"],
      postfixOperators = ["[", "("]

class Parser {
  constructor(t) { this.t = t }

  GO() {
    if (!this.t.eof()) return this.parseCode(false)

    return this.blankAst()
  }

  parseCode(checkForEnd, inFunction = false) {
    var ast = this.blankAst()

    while (!this.t.eof()) {
      var tok = this.t.peek(), singleLine = false

      if (checkForEnd) {
        if (tok.type === "punc" && tok.value === ":") {
          this.t.next()
          singleLine = true
        } else if (!this.t.newLine) error(this.unexpectedToken(tok, "expected a new line or ':' to start code block"))
      }

      var statement = this.nextStatement(inFunction)
      ast[statement.type === "funcDecl" ? "declarations" : "statements"].push(statement)

      if (this.t.eof()) {
        if (checkForEnd && !singleLine) error(`Unterminated ${inFunction ? "function body" : "code block"}.`)

        return ast
      }

      tok = this.t.peek()

      if (singleLine || (checkForEnd && ((tok.type === "punc" && tok.value === ";") || (tok.type === "keyword" && ["end", "elif", "else", "or"].includes(tok.value))))) {
        if (!singleLine && tok.value === "end") this.t.next()

        return ast
      }

      if (!this.t.newLine && !this.t.eof())
        error(this.unexpectedToken(
          this.t.peek(),
          checkForEnd ? "expected a new line, ';', or 'end'" : "expected a new line at the end of statement"
        ))
    }

    error("Empty code block.", true)

    return ast
  }

  blankAst() {
    return {
      declarations : [],
      statements : []
    }
  }

  parseClassCode() {
    var ast = [],
        tok = this.t.next()

    if (tok.type !== "identifier") error(this.unexpectedToken(tok, "expected an identifier for class name"))
    var name = tok.value,
        superclass = null,
        mixins = []

    tok = this.t.next()

    if (tok.type === "keyword" && tok.value === "extends") {
      superclass = this.parseExpression(this.t.next())

      tok = this.t.next()
    }

    if (tok.type === "keyword" && tok.value === "with") {
      mixins = this.parseIdentifierList()

      tok = this.t.next()
    }

    while (!(tok.type === "keyword" && tok.value === "end") && !(tok.type === "punc" && tok.value === ";")) {
      var isStatic = false, getter = false, setter = false

      keywordIf: if (tok.type === "keyword") {
        if (tok.value === "static") {
          isStatic = true

          tok = this.t.next()

          if (tok.type !== "keyword") break keywordIf
        }

        if (tok.value === "get") getter = true
        else if (tok.value === "set") setter = true

        if (getter || setter) tok = this.t.next()
      }

      // TODO check for parentheses to parse computed keys
      if (tok.type !== "identifier") error(this.unexpectedToken(tok, "expected an identifier"))

      var nextTok = this.t.peek()

      if (nextTok.type === "operator" && nextTok.value === "=") {
        if (getter || setter) error("Class fields cannot be getters or setters.")

        this.t.next()

        ast.push({
          type : "field",
          isStatic,
          name : tok.value,
          value : this.parseExpression(this.t.next())
        })
      } else {
        var funcDecl = this.parseFuncDecl(false, tok.value)

        funcDecl.type = "method"

        funcDecl.isStatic = isStatic
        funcDecl.getter = getter
        funcDecl.setter = setter

        ast.push(funcDecl)
      }

      tok = this.t.next()
    }

    return {
      type : "class",
      name,
      superclass,
      mixins,
      contents : ast
    }
  }

  nextStatement(inFunction) {
    var tok = this.t.next(), statement

    if (tok.type === "keyword" && (tok.value === "function" || tok.value === "fn")) statement = this.parseFuncDecl()
    else if (tok.type === "keyword" && tok.value === "cache") statement = this.parseFuncDecl(true)
    else if (tok.type === "keyword" && tok.value === "if") statement = this.parseIf()
    else if (tok.type === "keyword" && tok.value === "loop") statement = this.parseLoop()
    else if (tok.type === "keyword" && tok.value === "return") statement = this.parseReturn()
    else
      statement = {
        type : "expression",
        value : this.parseExpression(tok, null)
      }

    return statement
  }

  parseExpression(tok, isNumerical = false) {
    var stack = []

    this.parseExpressionSegment(tok, isNumerical, stack)

    tok = this.t.peek()

    while (this.isTokOperator(tok) && !postfixOperators.includes(tok.value)) {
      stack.push({op : tok.value})

      this.t.next()
      tok = this.t.next()

      this.parseExpressionSegment(tok, isNumerical, stack)

      tok = this.t.peek()
    }

    var maxMergeAttempts = stack.length

    if (stack.length % 2 === 0) problem("Unexpected expression stack length.")

    while (stack.length > 1) {
      for (let i = 1; i < stack.length - 1; i += 2) {
        var opPrecedence = operatorPrecedence[stack[i].op],
            left = stack[i - 2],
            right = stack[i + 2]

        if ((stack[i - 1] === null && !stack[i].prefix) ||
          (stack[i + 1] === null && !stack[i].postfix))
          opPrecedence = -1
        else if (
          // left side
          (!left || (left.opPrecedence && (left.opPrecedence < opPrecedence + rightToLeftOperators.includes(opPrecedence)))) &&
          // right side
          (!right || (right.opPrecedence && (right.opPrecedence <= opPrecedence - rightToLeftOperators.includes(opPrecedence))))
        ) {
          stack.splice(i - 1, 3, {
            type : "operation",
            left : stack[i - 1],
            right : stack[i + 1],
            extra : stack[i].extra || null,
            op : stack[i].op,
            prefix : Boolean(stack[i].prefix),
            postfix : Boolean(stack[i].postfix)
          })

          break
        }
        
        stack[i].opPrecedence = opPrecedence
      }

      maxMergeAttempts--
      if (maxMergeAttempts <= 0) problem("Unable to parse expression.")
    }

    return stack[0]
  }

  parseExpressionSegment(tok, isNumerical, stack) {
    while (this.isTokOperator(tok) && prefixOperators.includes(tok.value)) {
      stack.push(...this.formatPrefixForStack(tok.value, false))

      tok = this.t.next()
    }

    stack.push(this.parseNoOpExpression(tok, isNumerical))

    tok = this.t.peek()
    while (this.isTokOperator(tok) && postfixOperators.includes(tok.value)) {
      if (tok.value === "(") {
        this.t.next()

        var params = this.parseParameters(true)

        stack.push({op : "(", postfix : true, extra : params}, null)
      } else if (tok.value === "[") {
        this.t.next()

        var index = this.parseExpression(this.t.next())

        tok = this.t.next()
        if (tok.type !== "punc" || tok.value !== "]") error(this.unexpectedToken(tok, "expected ']' to end array access"))

        stack.push({op : "[", postfix : true, extra : index}, null)
      } else {
        this.t.next()

        stack.push(...this.formatPrefixForStack(tok.value, true))
      }

      tok = this.t.peek()
    }
  }

  parseNoOpExpression(tok, isNumerical) {
    if (tok.type === "string")
      if (!isNumerical)
        return {
          type : "string",
          value : tok.value
        }
      else error("Unexpected string, expected a numerical expression.")
    else if (tok.type === "number")
      return {
        type : "number",
        value : tok.value
      }
    else if (tok.type === "identifier")
      return {
        type : "identifier",
        value : tok.value
      }
    else if (tok.type === "punc" && tok.value === "(") {
      var innerExpression = this.parseExpression(this.t.next(), isNumerical)

      innerExpression.parentheses = true

      var parenthesis = this.t.next()
      if (parenthesis.type === "punc" && parenthesis.value === ")") return innerExpression

      error(this.unexpectedToken(parenthesis, "expected ')'"))
    } else if (tok.type === "keyword" && (tok.value === "true" || tok.value === "false")) {
      if (isNumerical) error("Unexpected boolean, expected a numerical expression.")

      return {
        type : "boolean",
        value : tok.value
      }
    } else if (tok.type === "keyword" && tok.value === "null") {
      if (isNumerical) error("Unexpected null, expected a numerical expression.")

      return {type : "null"}
    } else if (tok.type === "keyword" && tok.value === "this") {
      if (isNumerical) error("Unexpected 'this', expected a numerical expression.")

      return {type : "this"}
    } else if (tok.type === "punc" && tok.value === "[") {
      if (isNumerical) error("Unexpected array, expected a numerical expression.")

      tok = this.t.peek()
      if (tok.type === "punc" && tok.value === "]") {
        this.t.next()

        return {
          type : "array",
          value : []
        }
      }

      var values = this.parseExpressionList("]")

      tok = this.t.next()
      if (tok.type !== "punc" || tok.value !== "]") error(this.unexpectedToken(tok, "expected ']' to end array."))

      return {
        type : "array",
        value : values
      }
    } else if (tok.type === "punc" && tok.value === "{") {
      if (isNumerical) error("Unexpected array, expected a numerical expression.")

      var entries = this.parseKVPairs()

      tok = this.t.next()
      if (tok.type !== "punc" || tok.value !== "}") error(this.unexpectedToken(tok, "expected '}' to end hash."))

      return {
        type : "hash",
        value : entries
      }
    } else if (tok.type === "keyword" && (tok.value === "function" || tok.value === "fn"))
      return this.parseFuncDecl(false, null)
    else if (tok.type === "keyword" && tok.value === "class")
      return this.parseClassCode()
    else if (tok.type === "keyword" && tok.value === "cache")
      return this.parseFuncDecl(true)
    else
      error(this.unexpectedToken(tok))
  }

  formatPrefixForStack(op, isPost) {
    return isPost
      ? [{postfix : true, op}, null]
      : [null, {prefix : true, op}]
  }

  isTokOperator(tok) {
    return tok.type === "operator" ||
      (tok.value === "[" && tok.type === "punc" && !tok.spaceBefore) ||
      (tok.value === "(" && tok.type === "punc" && !tok.spaceBefore)
  }

  parseParameters(paren = false) {
    var params = []

    var tok = this.t.peek()

    if (paren && tok.type === "punc" && tok.value === ")") this.t.next()
    else if (!this.t.eof()) {
      params = this.parseExpressionList(paren && ")")

      if (paren) {
        tok = this.t.next()
        if (tok.type !== "punc" || tok.value !== ")") error(this.unexpectedToken(tok, "expected ')' to end function call"))
      }
    }

    return params
  }

  parseExpressionList(closeChar) {
    var expression, expressions = [], tok

    do {
      expression = this.parseExpression(this.t.next())
      expressions.push(expression)

      tok = this.t.peek()

      if (tok.type === "punc" && tok.value === ",") this.t.next()
      else if (!closeChar) break
    } while (!closeChar || tok.type !== "punc" || tok.value !== closeChar)

    return expressions
  }

  parseFunctionParameters(optional = false, parens = false) {
    var params = [], tok,
        firstParam = this.parseFunctionParameter(optional)

    if (firstParam) params.push(firstParam)
    else if (optional) return params
    else error(this.unexpectedToken(tok), "expected a parameter list")

    do {
      tok = this.t.peek()

      if (tok.type === "punc" && tok.value === "," && !parens) {
        this.t.next()

        params.push(this.parseFunctionParameter())
      } else {
        if (this.t.newLine) break

        var param = this.parseFunctionParameter(true)

        if (param) params.push(param)
        else break
      }
    } while (parens || !this.t.newLine)

    return params
  }

  parseFunctionParameter(optional = false) {
    var tok = this.t.peek(),
        param

    if (tok.type === "identifier") {
      this.t.next()

      param = {
        type : "basic",
        name : tok.value
      }
    } else if (tok.type === "punc" && tok.value === "[") {
      this.t.next()

      param = {
        type : "list",
        params : this.parseFunctionParameters()
      }

      tok = this.t.next()
      if (tok.type !== "punc" || tok.value !== "]")
        error(this.unexpectedToken(tok, "expected a ']' to end array parameter destructuring"))
    } else if (tok.type === "punc" && tok.value === "{") {
      this.t.next()

      var items = {}
      tok = this.t.next()

      do {
        if (tok.type !== "identifier") error(this.unexpectedToken(tok, "expected an identifier or a '}' to end object parameter destructuring"))

        var key = tok.value, reassign = null

        tok = this.t.next()
        if (tok.type === "punc" && tok.value === ":") {
          reassign = this.parseFunctionParameter()

          tok = this.t.next()
        }

        if (tok.type === "punc" && tok.value === ",") tok = this.t.next()

        items[key] = reassign
      } while (tok.type !== "punc" || tok.value !== "}")

      param = {
        type : "object",
        params : items
      }
    } else if (optional)
      return null
    else
      error(this.unexpectedToken(tok, "expected a function parameter"))

    tok = this.t.peek()
    if (tok.type === "operator" && tok.value === "=") {
      this.t.next()

      param.default = this.parseExpression(this.t.next())
    }

    return param
  }

  parseIdentifierList(optional, parens) {
    var tok = this.t.peek(), identifiers = []

    if (!(tok.type === "identifier")) {
      if (optional) return identifiers

      error(this.unexpectedToken(tok, "expected an identifier"))
    }

    while (tok.type === "identifier") {
      tok = this.t.next()

      identifiers.push(tok.value)

      if (this.t.newLine && !parens) break

      tok = this.t.peek()

      if (tok.type === "punc" && tok.value === ",") {
        this.t.next()
        tok = this.t.peek()
      }

      if (tok.type === "punc" && tok.value === ")") {
        this.t.next()

        break
      }
    }

    return identifiers
  }

  parseKVPairs() {
    var tok = this.t.peek(), pairs = {}

    while (tok.type === "identifier") {
      var key = tok.value
      this.t.next()

      tok = this.t.next()
      if (tok.type === "punc" && tok.value === ":")
        tok = this.t.next()

      pairs[key] = this.parseExpression(tok)

      tok = this.t.peek()
      if (tok.type === "punc" && tok.value === ",") {
        this.t.next()

        tok = this.t.peek()
      }
    }

    return pairs
  }

  parseFuncDecl(cache = false, name = undefined) {
    if (cache /* && !name */) this.t.next()

    var tok, parens = false

    if (name === undefined) {
      tok = this.t.next()

      if (tok.type === "identifier") name = tok.value
      else if (tok.type === "keyword") error("Keywords cannot be used as namespaces.")
      else error(this.unexpectedToken(tok, "expected an identifier"))
    }

    tok = this.t.peek()
    if (tok.type === "punc" && tok.value === "(") {
      parens = true
      this.t.next()
    }

    var params = !parens && this.t.newLine ? [] : this.parseFunctionParameters(true, parens)

    return {
      type : "funcDecl",
      name,
      params,
      body : this.parseCode(true, true),
      cache
    }
  }

  parseReturn() {
    return {
      type : "return",
      expression : this.parseExpression(this.t.next(), false)
    }
  }

  parseIf() {
    var ast = {
          type : "if",
          condition : this.parseExpression(this.t.next()),
          body : this.parseCode(true, false),
          else : null,
          elseOr : null
        },
        tok = this.t.peek()

    ast.ifOr = this.parseIfOr(tok)

    if (tok.type === "keyword") {
      if (tok.value === "else") {
        this.t.next()

        ast.else = this.parseCode(true, false)

        ast.elseOr = this.parseIfOr(this.t.peek())
      } else if (tok.value === "elif") {
        this.t.next()

        ast.else = {
          declarations : [],
          statements : [this.parseIf()]
        }
      }
    }

    return ast
  }

  parseIfOr(tok) {
    if (tok.type === "keyword" && tok.value === "or") {
      this.t.next()

      return {
        condition : this.parseExpression(this.t.next()),
        body : this.parseCode(true, false)
      }
    }

    return null
  }

  parseLoop() {
    return {
      type : "loop",
      times : this.parseExpression(this.t.next(), true),
      body : this.parseCode(true, false)
    }
  }

  unexpectedToken(tok, extra) {
    var token = tok.value ? `'${tok.value}'` : "end of file"

    return `Unexpected ${token}${extra ? ", " + extra : ""}.`
  }
}

// BUILTINS
function fillGlobalEnv(env, exec, {canvas}) {
  var builtIns = {}, fields = {}

  function validatePropertySettings(obj, name, value) {
    if (obj.getter && obj.setter)
      problem(`Property cannot be a getter and a setter: '${name}'`)

    if (value && (obj.getter || obj.setter)) {
      if (!value.is("Function"))
        problem(`Getter/setter property value must be a function: '${name}'`)

      if (obj.getter && value.requiredParams)
        problem(`Getter cannot have parameters: '${name}'`)
    }
  }

  function setProperty(data, name, value, propertySettings) {
    var {getter, setter, writable, changeable} = propertySettings,
        originalSettings = typeof data[name] === "function" ? undefined : data[name]

    if (!data[name] || typeof data[name] === "function")
      data[name] = {
        value : null,
        getter : null,
        setter : null,
        writable : true,
        changeable : true,
        private : false
      }

    var obj = data[name]

    if (getter) obj.getter = value
    else if (setter) obj.setter = value
    else {
      obj.value = value

      obj.writable = writable ?? (originalSettings?.writable ?? true)
      obj.changeable = changeable ?? (originalSettings?.changeable ?? true)
      obj.private = propertySettings.private ?? (originalSettings?.private ?? false)
    }
  }

  class Base {
    primitive = false

    dataIsCopy = false

    get value() {
      if (this.valueExists("__value")) {
        // if (!this.valueExists("__is")) error("'__value' function requires the existence of an '__is' function in the same object.", false, true)

        var valueFunc = this.getValue("__value")
        if (!(valueFunc.is("Function"))) error("'__value' property must be a function (or not defined).", false, true)

        var res = valueFunc.call(this, [])
        if (!(res.is(this.getName()))) error("Unexpected type returned by '__value' function.", false, true)

        return res.value
      } else return this._value
    }
    set value(val) { this._value = val }

    ensureDataIsCopy() {
      if (!this.dataIsCopy) {
        var oldData = this.data

        this.data = {}
        Object.assign(this.data, oldData)

        this.dataIsCopy = true
      }
    }

    setThisValue(name, value, propertySettings = {}) {
      if (this.primitive) error(`Cannot set a property of a primitive (${this.getName()}).`, false, true)

      this.ensureDataIsCopy()

      validatePropertySettings(propertySettings, name, value)

      setProperty(this.data, name, value, propertySettings)

      // this.data[name] = {
      //   value : getter || setter ? null : value,
      //   getter : getter ? value : null,
      //   setter : setter ? value : null,
      //   writable : writable ?? (originalSettings?.writable ?? true),
      //   changeable : changeable ?? (originalSettings?.changeable ?? true),
      //   private : propertySettings.private ?? (originalSettings?.private ?? false)
      // }
    }

    setValue(name, value, reportResult = false, propertySettings = {}, force = false) {
      if (this.primitive) error(`Cannot set a property of a primitive (${this.getName()}).`, false, true)

      if (this.trueValueExists(name)) {
        if (this.data[name].setter)
          this.data[name].setter.call(this, [value])
        else if (this.data[name].getter)
          error(`Cannot assign to a property that has a getter but no setter '${name}'.`)
        else if (!this.data[name].writable && !force)
          error(`Cannot assign to non-writable property '${name}'.`, false, true)

        this.setThisValue(name, value, propertySettings)
      } else if (this.parent) {
        var result = this.parent.setValue(name, value, true)

        if (result === false) {
          if (reportResult) return false

          // TODO check for setter here
          this.setThisValue(name, value)
        }
      } else if (reportResult) return false

      this.setThisValue(name, value)
    }

    getValue(name, mustExist = false) {
      if (this.trueValueExists(name)) {
        var prop = this.data[name]

        if (prop.private) error(`Attempting to access private property '${name}'`)

        if (prop.getter) return prop.getter.call(this, [])

        return prop.value
      } else if (this.parent) return this.parent.getValue(name, mustExist)
      else if (mustExist) error(`Property '${name}' does not exist.`, false, true)

      return new builtIns.Null()
    }

    deleteValue(name, mustExist = false) {
      if (this.trueValueExists(name)) {
        this.ensureDataIsCopy()

        delete this.data[name]

        return new builtIns.Boolean(true)
      } else if (this.parent) return this.parent.deleteValue()
      else if (mustExist) error(`Cannot delete property '${name}' because it does not exist.`, false, true)

      return new builtIns.Boolean()
    }

    getPropertyData(name) {
      if (this.trueValueExists(name))
        return this.data[name]
      else if (this.parent)
        return this.parent.getPropertyData(name)

      return null
    }

    valueExists(name) {
      // if (name in this.data) return true
      // else if (this.parent) return this.parent.valueExists(name)

      // return false

      return this.trueValueExists(name) || (this.parent?.valueExists(name) ?? null)
    }

    trueValueExists(name) {
      // debugger
      return name in this.data && typeof this.data[name] !== "function"
    }

    findParentWithValue(name) {
      if (this.trueValueExists(name)) return this
      else if (this.parent) return this.parent.findParentWithValue(name)

      return null
    }

    squareBracketGet(key) {
      if (this.valueExists("__get")) {
        var getFunc = this.getValue("__get")

        if (!getFunc.is("Function")) error("'__get' property must be a function.", false, true)

        return getFunc.call(this, [key, this._get?.(key) || new builtIns.Null(), this])
      } else if (this._get)
        return this._get(key) || new builtIns.Null()
      else
        error(`Type ${this.getName()} does not support the '[' (get) operator.`)
    }

    squareBracketSet(key, val) {
      if (this.valueExists("__set")) {
        var setFunc = this.getValue("__set")

        if (!setFunc.is("Function")) error("'__set' property must be a function.", false, true)

        setFunc.call(this, [key, val, this._get?.(key) || new builtIns.Null(), this])
      } else if (this._set)
        this._set(key, val) || new builtIns.Null()
      else
        error(`Type ${this.getName()} does not support the '[' (set) operator.`)
    }

    is(type) {
      if (type === this.getName()) return true

      var current = this
      while (current.parent) {
        current = current.parent

        if (type === current.getName()) return true
      }

      return false
    }

    getName() {
      if (this.valueExists("__is")) {
        var isFunc = this.getValue("__is")
        if (!(isFunc.is("Function"))) error("'__is' property must be a function (or not defined).", false, true)

        var res = isFunc.call()
        if (!(res.is("String"))) error("'__is' function must return a string.")

        return res.value
      } else return this.name
    }

    toStringExtra = null

    getToStringExtra() {
      if (this.valueExists("__toStringExtra")) {
        var stringExtra = this.getValue("__toStringExtra")

        if (stringExtra.is("Function")) stringExtra = stringExtra.call(this)
        return stringExtra.func("toString").value
      }

      return this.toStringExtra
    }

    func(name, params = [], th) {
      return this.getValue(name, true).call(th || this, params)
    }

    _langClass = true
  }

  /*

  TEMPLATE:

  fields.CLASS_NAME = {}
  builtIns.CLASS_NAME = class extends Base {
    constructor(PARAMETERS) {
      super()

    }
    parent = new builtIns.PARENT_CLASS()
    data = fields.CLASS_NAME
    name = "EXTERNAL_NAME"
  }

  */

  fields.Object = {}
  builtIns.Object = class extends Base {
    data = fields.Object
    name = "Object"
  }

  fields.Hash = {}
  builtIns.Hash = class extends Base {
    constructor(value = {}) {
      super()

      Object.assign(this._value, value)
    }
    parent = new builtIns.Object()
    data = fields.Hash
    name = "Hash"

    toStringExtra() {
      var keyCount = Object.keys(this.value).length

      return `- ${keyCount} pair${keyCount === 1 ? "" : "s"}`
    }

    _value = {}

    _get(key) {
      if (key.is("String"))
        return this._value[key.value] || new builtIns.Null()
      else if (key.is("Number"))
        return this._value[key.func("toString").value] || new builtIns.Null()

      error(`Unexpected ${key.getName()}, hash keys must be either strings or numbers.`, false, true)
    }

    _set(key, val) {
      if (key.is("String"))
        this._value[key.value] = val
      else if (key.is("Number"))
        this._value[key.func("toString").value] = val
      else
        error(`Unexpected ${key.getName()}, hash keys must be either strings or numbers.`, false, true)
    }
  }

  fields.Array = {}
  builtIns.Array = class extends Base {
    constructor(value = []) {
      super()

      this._value = value
    }
    parent = new builtIns.Object()
    data = fields.Array
    name = "Array"

    _get(key) {
      if (!key.is("Number")) error(`Unexpected ${key.getName()}, expected a number for array index.`, false, true)

      var index = key.value

      if (!Number.isInteger(index)) error(`Non-integer array index: ${index}.`, false, true)

      if (index < 0) index += this._value.length

      if (index < 0 || index >= this._value.length) return new builtIns.Null()

      return this._value[index]
    }

    _set(key, val) {
      if (!key.is("Number")) error(`Unexpected ${key.getName()}, expected a number for array index.`, false, true)

      var index = key.value

      if (!Number.isInteger(index)) error(`Non-integer array index: ${index}.`, false, true)

      if (index < 0) index += this._value.length

      if (index < 0) error("Array index out of range (must be greater than -array.length)")

      this._value[index] = val
    }
  }

  fields.String = {}
  builtIns.String = class extends Base {
    constructor(content = "") {
      super()

      this._value = String(content)
    }
    primitive = true
    parent = new builtIns.Object()
    data = fields.String
    name = "String"
  }

  fields.Number = {}
  builtIns.Number = class extends Base {
    constructor(value = 0) {
      super()

      if (typeof value === "number") this._value = value
      else if (typeof value === "string" && /^\d*(\.\d+)?(e\+?\d+)?$/.test(value)) this._value = parseFloat(value)
      else problem(`Unable to convert expression to number${typeof value === "string" ? `: "${value}"` : ""}.`, false, true)
    }
    primitive = true
    parent = new builtIns.Object()
    data = fields.Number
    name = "Number"

    isInt() { return Number.isInteger(this.value) }
    isPosInt() { return this.isInt() && this.value >= 0 }
  }

  fields.Boolean = {}
  builtIns.Boolean = class extends Base {
    constructor(value = false) {
      super()

      this._value = Boolean(value)
    }
    primitive = true
    parent = new builtIns.Object()
    data = fields.Boolean
    name = "Boolean"
  }

  fields.Null = {}
  builtIns.Null = class extends Base {
    primitive = true
    _value = null
    parent = new builtIns.Object()
    data = fields.Null
    name = "Null"
  }

  fields.Function = {}
  builtIns.Function = class extends Base {
    constructor(params, body, environment, thisArg, cache) {
      super()

      this.params = params
      this.body = body
      this.env = environment || env
      this.thisArg = thisArg || exec.thisValue

      this.doCache = cache
      this.cache = []

      this.requiredParams = params.reduce((acc, x) => acc + (x === null || !x.default), 0)
    }
    parent = new builtIns.Object()
    data = fields.Function
    name = "Function"

    call(thisArg, params, vars = {}) {
      if (!Array.isArray(params)) problem("Params is not an array (builtIns.Function.call)")

      var env = thisArg || this.thisArg

      if (params.length < this.requiredParams)
        error(`Not enough parameters passed to function (expected ${(this.requiredParams < this.params.length ? "at least " : "") + this.requiredParams}).`, false, true)

      outer: for (let i of this.cache) {
        if (i.params.length !== params.length) continue

        for (let j = 0; j < params.length; j++)
          if (i.params[j] !== params[j])
            continue outer

        return i.value
      }

      params.forEach((x, i) => {
        if (this.params[i]) vars[this.params[i].name] = x
      })

      var returnVal
      if (this.body instanceof Function) returnVal = this.body(env, params, vars)
      else
        returnVal = exec.execBlock(
          this.body, // code to run
          true,      // is code in function
          vars,      // added variables to environment
          this.env,  // env to run body in
          env        // the object accessed when 'this' keyword is used
        )

      if (this.doCache)
        this.cache.push({
          params, value : returnVal
        })

      return returnVal || new builtIns.Null()
    }

    bind(thisArg) {
      var origFunc = this

      return new builtIns.Function(Array(this.requiredParams).fill(null), (_, params) => {
        return origFunc.call(thisArg, params)
      }, null, thisArg, )
    }
  }

  fields.Class = {}
  builtIns.Class = class extends Base {
    constructor(name, methods, fields, staticMethods, staticFields, superclass) {
      super()

      this.name = name

      this.methods = methods || []
      this.fields  = fields  || []

      for (let i of staticMethods) {
        this.setThisValue(i.name, i.value, {
          getter : i.getter,
          setter : i.setter,
          writable : false
        })
      }
      
      for (let i of staticFields)
        this.setThisValue(i.name, i.value)

      this.superclass = superclass || null
      
      this.env = exec.currentEnv
    }
    parent = new builtIns.Object()
    data = fields.Class
    name = "Class"

    new(args) { return new builtIns.Instance(this, args) }
  }

  fields.Instance = {}
  builtIns.Instance = class extends Base {
    constructor(cl, args) {
      super()

      for (let i of cl.methods) {
        if (typeof i.params === "number")
          i.params = Array(i.params).fill(null)

        this.setThisValue(i.name, new builtIns.Function(i.params || [], i.body, cl.env, this), {
          getter : i.getter,
          setter : i.setter,
          writable : false
        })
      }

      for (let i of cl.fields)
        this.setThisValue(i.name, typeof i.value === "function" ? i.value() : exec.execExpression(i.value))

      this.class = cl
      this.requireSuperCall = cl.superclass

      this.setThisValue("super", new builtIns.Function([], () => {
        return this.superclass || new builtIns.Null()
      }), {getter : true, writable : false, changeable : false})

      var constr = this.data.constructor

      if (constr.value?.is("Function"))
        constr.value.call(this, args, {
          super : new builtIns.Function([], (_, params) => {
            this.superCall(params)

            return this.superclass
          })
        })
      else if (typeof constr !== "function")
        error("Class constructor must be a function (or not defined).", false, true)
    }
    parent = new builtIns.Object()
    data = fields.Instance
    name = "Instance"

    superCall(args) {
      var supercl = this.class.superclass

      if (!supercl) error("Cannot call 'super()' in a class that does not have a superclass.", false, true)
      if (!this.requireSuperCall) error("Cannot call 'super()' more than once per instance.", false, true)

      this.superclass = supercl.new(args)
      this.requireSuperCall = false
    }

    setValue(name, value, reportResult = false, propertySettings = {}, force = false) {
      if (this.requireSuperCall)
        error(`Property '${name}' cannot be set until 'super()' is called.`, false, true)

      var instance = this

      while (instance) {
        if (instance.selfValueExists(name)) {
          // if (!instance.data[name].writable) error("Cannot set value of non-writable property.", false, true)
          if (instance.data[name].setter)
            this.data[name].setter.call(this, [value])
          else if (instance.data[name].getter)
            error(`Cannot assign to a property that has a getter but no setter '${name}'.`)
          else if (!this.data[name].writable && !force)
            error(`Cannot assign to non-writable property '${name}'.`, false, true)

          instance.setThisValue(name, value)
        }

        instance = instance.superclass
      }

      if (reportResult) return false
      else this.setThisValue(name, value)
    }

    selfValueExists(name) {
      return super.valueExists(name)
    }
    selfGetValue(name) {
      return super.valueExists(name) ? super.getValue(name) : null
    }

    getValue(name, mustExist = false) {
      if (this.requireSuperCall)
        error(`Property '${name}' cannot be accessed until 'super()' is called.`, false, true)

      var instance = this

      while (instance) {
        var value = instance.selfGetValue(name)
        if (value) return value

        instance = instance.superclass
      }

      if (mustExist) error(`Property '${name}' does not exist on instance of class '${this.class.name}'.`, false, true)
      else return new builtIns.Null()
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function fn(field, name, args, fn, propertySettings = {}) {
    validatePropertySettings(propertySettings, name)

    setProperty(fields[field], name, new builtIns.Function(Array(args).fill(null), fn), propertySettings)
  }

  fn("Object", "toString", 0, th => {
    var extra = th.getToStringExtra()
    if (extra !== null) return new builtIns.String(`[${th.getName()} ${extra}]`)

    return new builtIns.String(`[${th.getName()}]`)
  })
  fn("Object", "toBoolean", 0, () => new builtIns.Boolean(true))
  fn("Object", "type", 0, th => new builtIns.String(th.getName()), {getter : true})
  fn("Object", "trueType", 0, th => new builtIns.String(th.name), {getter : true})
  fn("Object", "typeInheritance", 0, (th, params) => {
    var delimiter = "."
    if (params[0] && params[0].is("String")) delimiter = params[0].value
    else if (params.length) error("Delimiter for [Object].typeInheritance must be a string or blank.", false, true)

    if (!("parent" in th)) return new builtIns.String(th.name.toLowerCase())

    return new builtIns.String(th.parent.func("typeInheritance", [delimiter]).value + delimiter + th.name.toLowerCase())
  }, {getter : true})
  fn("Object", "properties", 0, th => new builtIns.Array(Object.keys(th.data).map(x => new builtIns.String(x))), {getter : true})
  fn("Object", "propertyValues", 0, th => new builtIns.Array(Object.values(th.data).map(x => x.value)), {getter : true})
  fn("Object", "getPropertyData", 1, (th, params) => {
    if (!params[0].is("String")) error("Property name for [Object].getPropertyData must be a string.", false, true)

    if (!th.valueExists(params[0].value)) return new builtIns.Null()

    var data = th.getPropertyData(params[0].value),
        hash = {
          value : data.value,
          isGetter : new builtIns.Boolean(data.getter),
          isSetter : new builtIns.Boolean(data.setter),
          writable : new builtIns.Boolean(data.writable),
          changeable : new builtIns.Boolean(data.changeable)
          // private : new builtIns.Boolean(data.private)
        }

    // if (data.getter) hash.removeGetter = new builtIns.Function([], () => {})

    return new builtIns.Hash(hash)
  })
  fn("Object", "removeGetter", 1, (th, params) => {
    if (!params[0].is("String")) error("Getter name for [Object].removeGetter must be a string.", false, true)

    th.deleteValue(params[0].value, true)
  })
  fn("Object", "replaceGetter", 1, (th, params) => {
    if (!params[0].is("String")) error("Getter name for [Object].removeGetter must be a string.", false, true)

    var name = params[0].value,
        instanceWithValue = th.findParentWithValue(name)

    if (instanceWithValue === null) error(`Getter '${name}' for [Object].replaceGetter does not exist.`)

    var getterValue = instanceWithValue.getValue(name)

    instanceWithValue.deleteValue(name)
    instanceWithValue.setThisValue(name, getterValue)

    return getterValue
  })

  fn("Hash", "keys", 0, th => new builtIns.Array(Object.keys(th.value).map(x => new builtIns.String(x))), {getter : true})
  fn("Hash", "values", 0, th => new builtIns.Array(Object.values(th.value)), {getter : true})
  fn("Hash", "length", 0, th => new builtIns.Number(Object.keys(th.value).length), {getter : true})
  fn("Hash", "getValue", 1, (th, params) => th._get(params[0]))

  fn("Array", "toString", 0, (th, params) => {
    var delimiter = ", "
    if (params.length)
      if (params[0].is("String")) delimiter = params[0].value
      else error("Delimiter for [Array].toString must be a string or blank.")

    return new builtIns.String(`[${th.value.map(x => x.func("toString").value).join(delimiter)}]`)
  })
  fn("Array", "length", 0, th => new builtIns.Number(th.value.length), {getter : true})
  fn("Array", "push", 1, (th, params) => {
    th.value.push(...params)
  })
  fn("Array", "pop", 0, (th, params) => {
    if (params.length) {
      var val = params[0]?.value, resultArr = new builtIns.Array()

      if (val === undefined || !Number.isInteger(val) || val < 0)
        error("Amount of items to pop from array must be a positive integer or blank.")

      for (let i = 0; i < val; i++)
        resultArr.value.push(th.value.pop() || new builtIns.Null())

      return resultArr
    }

    return th.value.pop() || new builtIns.Null()
  })
  fn("Array", "unshift", 1, (th, params) => {
    th.value.unshift(...params)
  })
  fn("Array", "shift", 0, (th, params) => {
    if (params.length) {
      var val = params[0]?.value, resultArr = new builtIns.Array()

      if (val === undefined || !Number.isInteger(val) || val < 0)
        error("Amount of items to shift from array must be a positive integer or blank.")

      for (let i = 0; i < val; i++)
        resultArr.value.push(th.value.shift() || new builtIns.Null())

      return resultArr
    }

    return th.value.shift() || new builtIns.Null()
  })
  fn("Array", "reverse", 0, th => new builtIns.Array(th.value.slice().reverse()))
  fn("Array", "each", 1, (th, params) => {
    if (!params[0].is("Function")) error("Callback for [Array].each must be a function.", false, true)

    th.value.forEach((x, i) => {
      params[0].call(null, [x, new builtIns.Number(i)])
    })
  })
  fn("Array", "map", 1, (th, params) => {
    if (!params[0].is("Function")) error("Callback for [Array].map must be a function.", false, true)

    return new builtIns.Array(th.value.map(
      (x, i) => params[0].call(null, [x, new builtIns.Number(i)])
    ))
  })
  fn("Array", "filter", 1, (th, params) => {
    if (!params[0].is("Function")) error("Callback for [Array].filter must be a function.", false, true)

    return new builtIns.Array(th.value.filter(
      (x, i) => params[0].call(null, [x, new builtIns.Number(i)]).func("toBoolean").value
    ))
  })
  fn("Array", "filterInPlace", 1, (th, params) => {
    if (!params[0].is("Function")) error("Callback for [Array].filterInPlace must be a function.", false, true)

    th.value = th.value.filter(
      (x, i) => params[0].call(null, [x, new builtIns.Number(i)]).func("toBoolean").value
    )

    return th
  })
  fn("Array", "sum", 0, th => {
    return new builtIns.Number(th.value.reduce((acc, x) => {
      if (!x.is("Number")) error("All elements in summed array must be numbers.")

      return acc + x.value
    }, 0))
  })
  fn("Array", "average", 0, th => new builtIns.Number(th.func("sum").value / th.value.length))

  fn("String", "toString", 0, th => th)
  fn("String", "length", 0, th => new builtIns.Number(th.value.length), {getter : true})
  fn("String", "toBoolean", 0, th => new builtIns.Boolean(th.value.length))
  fn("String", "spread", 0, th => new builtIns.Array([...th.value]))
  fn("String", "reverse", 0, th => new builtIns.String([...th.value].reverse().join("")))
  fn("String", "slice", 0, (th, params) => {
    var start = 0, end = this.value.length

    if (params[0]) {
      if (!params[0].is("Number") || !Number.isInteger(params[0].value))
        error("Unexpected value for [String].slice, expected an integer.", false, true)

      start = params[0].value
    }
    if (params[1]) {
      if (!params[1].is("Number") || !Number.isInteger(params[1].value))
        error("Unexpected value for [String].slice, expected an integer.", false, true)

      end = params[1].value
    }

    return new builtIns.String(th.value.slice(start, end))
  })

  fn("Number", "isInt", 0, th => new builtIns.Boolean(th.isInt), {getter : true})
  fn("Number", "isPosInt", 0, th => new builtIns.Boolean(th.isPosInt()), {getter : true})
  fn("Number", "toString", 0, th => new builtIns.String(th.value))
  fn("Number", "toBoolean", 0, th => new builtIns.Boolean(th.value))

  fn("Number", "isPositive", 0, th => new builtIns.Boolean(th.value > 0), {getter : true})
  fn("Number", "isNegative", 0, th => new builtIns.Boolean(th.value < 0), {getter : true})
  fn("Number", "positive", 0, th => new builtIns.Number(Math.abs(th.value)), {getter : true})
  fn("Number", "negative", 0, th => new builtIns.Number(-Math.abs(th.value)), {getter : true})

  fn("Boolean", "toString", 0, th => new builtIns.String(th.value))
  fn("Boolean", "toBoolean", 0, th => th)

  fn("Null", "toString", 0, () => new builtIns.String("null"))
  fn("Null", "toBoolean", 0, () => new builtIns.Boolean(false))

  fn("Function", "toString", 0, th => new builtIns.String(`function [${th.body instanceof Function ? "internal code" : "body"}]`))

  fn("Class", "new", 0, (th, args) => th.new(args))

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

  env.Object = new builtIns.Function([], () => {
    return new builtIns.Object()
  })
  env.Hash = new builtIns.Function([], (_, params) => {
    if (params.length) {
      if (!params[0].is("Hash")) error("Parameter for Hash must be a hash or blank.", false, true)

      return new builtIns.Hash(params[0].value)
    } else return new builtIns.Hash()
  })
  env.Array = new builtIns.Function([], (_, params) => {
    if (params.length) {
      if (!params[0].is("Array")) error("Parameter for Array must be an array or blank.", false, true)

      return new builtIns.Array(params[0].value)
    } else return new builtIns.Array()
  })
  env.String = new builtIns.Function([], (_, params) => new builtIns.String(params.length ? params[0].func("toString").value : ""))
  env.Number = new builtIns.Function([], (_, params) => new builtIns.Number(params.length ? params[0].value : 0))
  env.Boolean = new builtIns.Function([], (_, params) => new builtIns.Boolean(params.length && params[0].func("toBoolean").value))
  env.Null = new builtIns.Function([], () => new builtIns.Null())

  env.getVar = new builtIns.Function([null], (th, params) => {
    if (!params.length || !(params[0].is("String"))) error("Namespace name for getVar must be a string.", false, true)

    var environment = exec.currentEnv

    if (!environment.valueExists(params[0].value)) {
      if (params[1] && params[1].func("toBoolean").value) error("Namespace for getVar does not exist.", false, true)
      else return new builtIns.Null()
    }

    return environment.getValue(params[0].value)
  })

  env.print = new builtIns.Function([null], (_, params) => {
    for (let i of params) log(i.func("toString").value)
  })
  env.formatPrint = new builtIns.Function([null], (_, params) => {
    for (let i of params) log(formatMessage(i))
  })

  // __DEBUG
  var debugObj = env.__debug = new builtIns.Object()

  debugObj.setThisValue("print", new builtIns.Function([null], (_, params) => {
    if (typeof console?.log !== "function") error("Could not locate a console for __debug.print.", false, true)

    for (let i of params) console.log(i.func("toString").value)
  }))
  debugObj.setThisValue("log", new builtIns.Function([null], (_, params) => {
    if (typeof console?.log !== "function") error("Could not locate a console for __debug.log.", false, true)

    for (let i of params) console.log(i)
  }))
  debugObj.setThisValue("intoVar", new builtIns.Function([null, null], (_, params) => {
    if (typeof console?.log !== "function") error("Could not locate a console for __debug.log.", false, true)

    if (!params[0].is("String")) error("Variable name for __debug.intoVar must be a string.", false, true)

    window[params[0].value] = params[1]
  }))

  debugObj.setThisValue("logEnv", new builtIns.Function([], () => {
    if (typeof console?.log !== "function") error("Could not locate a console for __debug.logEnv.", false, true)

    console.log(exec.currentEnv)
  }))
  debugObj.setThisValue("logGlobalEnv", new builtIns.Function([], () => {
    if (typeof console?.log !== "function") error("Could not locate a console for __debug.logGlobalEnv.", false, true)

    console.log(exec.globalEnv)
  }))

  // MATH
  var mathObj = env.math = new builtIns.Object()

  mathObj.setThisValue("random", new builtIns.Function([], (_, params) => {
    var min = 0, max = 1

    if (params[0]) {
      if (!params[0].is("Number")) error("Unexpected parameter type for math.random, expected a number.", false, true)

      if (params[1]) min = params[0].value
      else max = params[0].value
    }
    if (params[1]) {
      if (!params[1].is("Number")) error("Unexpected parameter type for math.random, expected a number.", false, true)

      max = params[1].value
    }

    if (max < min) [min, max] = [max, min]

    return new builtIns.Number(Math.random() * (max - min) + min)
  }))

  mathObj.setThisValue("randInt", new builtIns.Function([], (_, params) => {
    var min = 0, max = 1

    if (params[0]) {
      if (!params[0].is("Number") || !Number.isInteger(params[0].value))
        error("Unexpected parameter type for math.random, expected an integer.", false, true)

      if (params[1]) min = params[0].value
      else max = params[0].value
    }
    if (params[1]) {
      if (!params[1].is("Number") || !Number.isInteger(params[1].value))
        error("Unexpected parameter type for math.random, expected an integer.", false, true)

      max = params[1].value
    }

    if (max < min) [min, max] = [max, min]

    return new builtIns.Number(Math.floor(Math.random() * (max - min)) + min)
  }))

  mathObj.setThisValue("randBool", new builtIns.Function([], (_, params) => {
    if (params[0] && !params[0].is("Number")) error("Chance for math.randBool must be a number or blank (default 0.5).", false, true)

    return new builtIns.Boolean(Math.random() < (params[0]?.value ?? 0.5))
  }))

  // TIME
  var timeObj = env.time = new builtIns.Object(),
      dayNames = {
        full : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        medium : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        short : ["Su", "M", "Tu", "W", "Th", "F", "Sa"],
        single : ["S", "M", "T", "W", "T", "F", "S"],
        singleUnique : ["U", "M", "T", "W", "H", "F", "S"]
      },
      monthNames = {
        full : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        short : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        // short : ["Ja", "F", "Mr", "Ap", "My", "Jn", "Jl", "Au", "S", "O", "N", "D"],
        single : ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"]
      }

  timeObj.setThisValue("milliseconds", new builtIns.Function([], () => new builtIns.Number(new Date().getMilliseconds())))
  timeObj.setThisValue("seconds", new builtIns.Function([], () => new builtIns.Number(new Date().getSeconds())))
  timeObj.setThisValue("minutes", new builtIns.Function([], () => new builtIns.Number(new Date().getMinutes())))
  timeObj.setThisValue("hours", new builtIns.Function([], () => new builtIns.Number(new Date().getHours())))
  timeObj.setThisValue("day", new builtIns.Function([], () => new builtIns.Number(new Date().getDay())))
  timeObj.setThisValue("month", new builtIns.Function([], () => new builtIns.Number(new Date().getMonth())))
  timeObj.setThisValue("year", new builtIns.Function([], () => new builtIns.Number(new Date().getFullYear())))
  timeObj.setThisValue("shortYear", new builtIns.Function([], () => new builtIns.Number(new Date().getFullYear() % 100)))

  timeObj.setThisValue("UTCMilliseconds", new builtIns.Function([], () => new builtIns.Number(new Date().getUTCMilliseconds())))
  timeObj.setThisValue("UTCSeconds", new builtIns.Function([], () => new builtIns.Number(new Date().getUTCSeconds())))
  timeObj.setThisValue("UTCMinutes", new builtIns.Function([], () => new builtIns.Number(new Date().getUTCMinutes())))
  timeObj.setThisValue("UTCHours", new builtIns.Function([], () => new builtIns.Number(new Date().getUTCHours())))
  timeObj.setThisValue("UTCDay", new builtIns.Function([], () => new builtIns.Number(new Date().getUTCDay())))
  timeObj.setThisValue("UTCMonth", new builtIns.Function([], () => new builtIns.Number(new Date().getUTCMonth())))
  timeObj.setThisValue("UTCYear", new builtIns.Function([], () => new builtIns.Number(new Date().getUTCFullYear())))
  timeObj.setThisValue("UTCShortYear", new builtIns.Function([], () => new builtIns.Number(new Date().getUTCFullYear() % 100)))

  timeObj.setThisValue("dayName", new builtIns.Function([], (_, params) => {
    var days = dayNames.full

    if (params[0]) {
      if (params[0].is("String")) {
        if (params[0].value in dayNames)
          days = dayNames[params[0].value]
        else
          error("Invalid day name string, expected one of: 'full', 'medium', 'short', 'single', 'singleUnique'.", false, true)
      } else if (params[0].is("Array")) {
        if (params[0].value.length < 7)
          error("Not enough day names in array, expected seven.", false, true)

        days = params[0].value.map(x => x.func("toString").value)
      } else
        error("Invalid parameter type for time.dayName.", false, true)
    }

    return new builtIns.String(days[new Date().getDay()])
  }))

  timeObj.setThisValue("monthName", new builtIns.Function([], (_, params) => {
    var months = monthNames.full

    if (params[0]) {
      if (params[0].is("String")) {
        if (params[0].value in monthNames)
          months = monthNames[params[0].value]
        else
          error("Invalid month name string, expected one of: 'full', 'short', 'single'.", false, true)
      } else if (params[0].is("Array")) {
        if (params[0].value.length < 12)
          error("Not enough month names in array, expected twelve.", false, true)

        months = params[0].value.map(x => x.func("toString").value)
      } else
        error("Invalid parameter type for time.monthName.", false, true)
    }

    return new builtIns.String(months[new Date().getMonth()])
  }))

  timeObj.setThisValue("now", new builtIns.Function([], () => new builtIns.Number(Date.now())))
  timeObj.setThisValue("totalSeconds", new builtIns.Function([], () => new builtIns.Number(Math.trunc(Date.now() / 1000))))
  timeObj.setThisValue("totalMinutes", new builtIns.Function([], () => new builtIns.Number(Math.trunc(Date.now() / 60_000))))
  timeObj.setThisValue("totalHours", new builtIns.Function([], () => new builtIns.Number(Math.trunc(Date.now() / 3_600_000))))
  timeObj.setThisValue("totalDays", new builtIns.Function([], () => new builtIns.Number(Math.trunc(Date.now() / 86_400_000))))

  timeObj.setThisValue("trueTotalSeconds", new builtIns.Function([], () => new builtIns.Number(Date.now() / 1000)))
  timeObj.setThisValue("trueTotalMinutes", new builtIns.Function([], () => new builtIns.Number(Date.now() / 60_000)))
  timeObj.setThisValue("trueTotalHours", new builtIns.Function([], () => new builtIns.Number(Date.now() / 3_600_000)))
  timeObj.setThisValue("trueTotalDays", new builtIns.Function([], () => new builtIns.Number(Date.now() / 86_400_000)))

  // DELAYS

  const intervals = []

  env.setInterval = new builtIns.Function([null], (_, params) => {
    if (!params[0].is("Function")) error(`Unexpected ${params[0].getName()}, expected a function for setInterval.`, false, true)

    if (params[1] && (!params[1].is("Number") || params[1].value < 0)) error("Unexpected value for setInterval wait time, expected a positive number.", false, true)

    var intervalId = setInterval(() => {
      params[0].call(null, params.slice(2), {__intervalId : interval})
    }, params[1] ? params[1].value : 0)

    intervals.push(intervalId)

    var interval = new builtIns.Number(intervals.indexOf(intervalId))

    return interval
  })

  env.clearInterval = new builtIns.Function([null], (_, params) => {
    if (!params[0].is("Number") || !params[0].isPosInt())
      error("Unexpected value for clearInterval id, expected a positive integer.", false, true)

    var intervalId = intervals[params[0].value]

    if (intervalId) {
      clearInterval(intervalId)

      intervals[params[0].value] = null

      return new builtIns.Boolean(true)
    } else return new builtIns.Boolean()
  })

  // GRAPHICS

  env.Graphics = canvas ? initGraphics(builtIns, canvas) : new builtIns.Null()

  return {
    builtIns,
    stop() {
      for (let i of intervals)
        if (i) clearInterval(i)
    }
  }
}

// GRAPHICS
function initGraphics(builtIns, canvas) {
  const ctx = canvas.getContext("2d")

  canvas.width = canvas.offsetWidth * devicePixelRatio
  canvas.height = canvas.offsetHeight * devicePixelRatio

  ctx.scale(devicePixelRatio, devicePixelRatio)

  function verifyNum(num, paramName = null) {
    if (!num.is("Number"))
      error(`Unexpected ${num.getName()}, expected a number${paramName ? ` for '${paramName}' parameter` : ""}.`, false, true)

    return num
  }

  function convertNums(nums, paramNames = []) {
    return nums.map((x, i) => verifyNum(x, paramNames[i]).value)
  }

  function verifyColor(color) {
    if (!color.is("String")) error(`Unexpected ${color.getName()}, expected a string for color.`, false, true)

    // if (!/^(#(([0-9A-Fa-f]{3})|(([0-9A-Fa-f]{2}){2,4})))$/.test(color.value)) error(`Unexpected "${color.value}", expected a color.`)

    return color
  }

  return new builtIns.Class(
    "Graphics",
    // methods
    [
      // constructor
      {
        name : "constructor",
        body : th => {
          window.showCanvas?.()

          th.internal = {
            // hidden properties
            fillStyle : new builtIns.String("black"),
            strokeStyle : new builtIns.String("black"),
            lineWidth : new builtIns.Number(1),
            opacity : new builtIns.Number(1),

            // internal methods
            setupCtx() {
              ctx.fillStyle = this.fillStyle.value
              ctx.strokeStyle = this.strokeStyle.value
              ctx.lineWidth = this.lineWidth.value

              ctx.globalAlpha = this.opacity.value
            }
          }
        }
      },
      // drawing methods
      {
        name : "fillRect",
        params : 3,
        body : (th, params) => {
          th.internal.setupCtx()

          if (params.length === 3) params[3] = params[2]

          ctx.fillRect(...convertNums(params))
        }
      },
      {
        name : "strokeRect",
        params : 3,
        body : (th, params) => {
          th.internal.setupCtx()

          if (params.length === 3) params[3] = params[2]

          ctx.strokeRect(...convertNums(params))
        }
      },
      {
        name : "drawRect",
        params : 3,
        body : (th, params) => {
          th.internal.setupCtx()

          if (params.length === 3) params[3] = params[2]

          ctx.beginPath()
          ctx.rect(...convertNums(params))

          ctx.fill()
          ctx.stroke()
        }
      },
      {
        name : "clearRect",
        params : 3,
        body : (_, params) => {
          if (params.length === 3) params[3] = params[2]

          ctx.clearRect(...convertNums(params))
        }
      },
      {
        name : "fillCircle",
        params : 3,
        body : (th, params) => {
          th.internal.setupCtx()

          ctx.beginPath()
          ctx.arc(...convertNums(params), 0, 2 * Math.PI)

          ctx.fill()
        }
      },
      {
        name : "strokeCircle",
        params : 3,
        body : (th, params) => {
          th.internal.setupCtx()

          ctx.beginPath()
          ctx.arc(...convertNums(params), 0, 2 * Math.PI)

          ctx.fill()
        }
      },
      {
        name : "drawCircle",
        params : 3,
        body : (th, params) => {
          th.internal.setupCtx()

          ctx.beginPath()
          ctx.arc(...convertNums(params), 0, 2 * Math.PI)

          ctx.fill()
          ctx.stroke()
        }
      },
      // "every frame" methods
      {
        name : "clear",
        body : () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
      },
      {
        name : "background",
        params : 1,
        body : (_, params) => {
          ctx.fillStyle = verifyColor(params[0]).value

          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
      },
      // getters and setters
      {
        name : "fillStyle",
        getter : true,
        body : th => th.internal.fillStyle
      },
      {
        name : "fillStyle",
        setter : true,
        params : 1,
        body : (th, params) => {
          th.internal.fillStyle = verifyColor(params[0])
        }
      },
      {
        name : "strokeStyle",
        getter : true,
        body : th => th.internal.strokeStyle
      },
      {
        name : "strokeStyle",
        setter : true,
        params : 1,
        body : (th, params) => {
          th.internal.strokeStyle = verifyColor(params[0])
        }
      },
      {
        name : "lineWidth",
        getter : true,
        body : th => th.internal.lineWidth
      },
      {
        name : "lineWidth",
        setter : true,
        params : 1,
        body : (th, params) => {
          th.internal.lineWidth = verifyNum(params[0])
        }
      },
      {
        name : "opacity",
        getter : true,
        body : th => th.internal.opacity
      },
      {
        name : "opacity",
        setter : true,
        params : 1,
        body : (th, params) => {
          th.internal.opacity = verifyNum(params[0])
        }
      }
    ],
    // fields
    [
      {
        name : "width",
        writable : false,
        value : () => new builtIns.Number(800)
      },
      {
        name : "height",
        writable : false,
        value : () => new builtIns.Number(500)
      }
    ],
    // static methods
    [],
    // static fields
    []
  )
}

// EXEC
class Executor {
  constructor(ast, {canvas} = {}) {
    this.ast = ast

    this.canvasElem = canvas || null
  }

  currentEnv = null

  GO() {
    this.globalEnv = this.newEnv(null, this)

    this.thisValue = new this.builtIns.Null()

    if (this.ast.declarations.length || this.ast.statements.length) this.execBlock(this.ast, false)
  }

  _stop() {}

  stop() {
    this._stop()
  }

  newEnv(parent, global = false) {
    return this.currentEnv = new Environment(parent || this.currentEnv, global)
  }

  execBlock(block, inFunction, addedVars = {}, env = null, thisValue = null) {
    var oldEnv = this.currentEnv,
        oldThis = this.thisValue,
        returnVal

    if (thisValue)
      this.thisValue = thisValue

    this.newEnv(env)

    for (let i in addedVars)
      this.currentEnv.setThisValue(i, addedVars[i])

    for (let i of block.declarations)
      this.execFuncDecl(i)

    for (let i of block.statements) {
      this.execStatement(i)

      if (this.return) {
        returnVal = this.return

        if (inFunction) this.return = null

        break
      }
    }

    this.currentEnv = oldEnv
    this.thisValue = oldThis

    return returnVal
  }

  execStatement(ast) {
    if (ast.type === "expression") this.execExpression(ast.value)
    else if (ast.type === "return") this.return = this.execExpression(ast.expression)
    else if (ast.type === "if") this.execIf(ast)
    else if (ast.type === "loop") this.execLoop(ast)
    else error(`Statement type ${ast.type} is currently not implemented, it will be ignored.`, true, true)
  }

  execExpression(ast, retLeft = false, thisValue = null) {
    var oldThis = this.thisValue
    if (thisValue) this.thisValue = thisValue

    var returnVal

    if (ast.type === "operation") returnVal = this.execOperation(ast, retLeft)
    else if (ast.type === "identifier") returnVal = this.currentEnv.getValue(ast.value, true)
    else if (ast.type === "number") returnVal = new this.builtIns.Number(ast.value)
    else if (ast.type === "string") returnVal = new this.builtIns.String(ast.value)
    else if (ast.type === "boolean") returnVal = new this.builtIns.Boolean(ast.value === "true")
    else if (ast.type === "null") returnVal = new this.builtIns.Null()
    else if (ast.type === "array") returnVal = new this.builtIns.Array(ast.value.map(x => this.execExpression(x)))
    else if (ast.type === "hash")
      returnVal = new this.builtIns.Hash(
        Object.fromEntries(Object.entries(ast.value).map(x => [x[0], this.execExpression(x[1], false)]))
      )
    else if (ast.type === "class") returnVal = this.execClass(ast)
    else if (ast.type === "this") returnVal = this.thisValue
    else if (ast.type === "funcDecl") returnVal = this.execFuncDecl(ast)
    else {
      error(`Expression type ${ast.type} is currently not implemented, it will be replaced with a null.`, true, true)
      returnVal = new this.builtIns.Null()
    }

    if (thisValue) this.thisValue = oldThis

    return returnVal
  }

  execOperation(ast, retLeft = false) {
    var {left, right, op} = ast,
        isAssignment = op.endsWith("=") && !["==", "!=", ">=", "<=", "~="].includes(op),
        res, context = null

    if (left && !isAssignment) {
      left = this.execExpression(left, op === "(" && (left.op === "." || left.op === "["))

      if (Array.isArray(left)) [left, context] = left
    }
    if (right && !["&&", "||", "."].includes(op)) right = this.execExpression(right)

    if (op === "(")
      res = this.execFuncCall(left, ast.extra, context)
    else if (op === "..")
      res = new this.builtIns.String(left.func("toString").value + right.func("toString").value)
      // ARITHMETIC
    else if (op === "+") {
      if (left.is("Number") && right.is("Number")) res = new this.builtIns.Number(left.value + right.value)
      else if (left.is("Array") && right.is("Array")) res = new this.builtIns.Array(left.value.concat(right.value))
      else if (left.is("String") && right.is("String")) res = new this.builtIns.String(left.value + right.value)
      else error(`Cannot add types ${left.name} and ${right.name}.`, false, true)
    } else if (op === "-") {
      if (left.is("Number") && right.is("Number")) res = new this.builtIns.Number(left.value - right.value)
      else error(`Cannot subtract types ${left.name} and ${right.name}.`, false, true)
    } else if (op === "*") {
      if (left.is("Number") && right.is("Number")) res = new this.builtIns.Number(left.value * right.value)
      else error(`Cannot multiply types ${left.name} and ${right.name}.`, false, true)
    } else if (op === "/") {
      if (left.is("Number") && right.is("Number")) res = new this.builtIns.Number(left.value / right.value)
      else error(`Cannot divide types ${left.name} and ${right.name}.`, false, true)
    } else if (op === "**") {
      if (left.is("Number") && right.is("Number")) res = new this.builtIns.Number(left.value ** right.value)
      else error(`Cannot raise type ${left.name} to type ${right.name}.`, false, true)
      // LOGIC
    } else if (op === "&&") {
      if (!left.func("toBoolean").value) res = left
      else res = this.execExpression(right)
    } else if (op === "||") {
      if (left.func("toBoolean").value) res = left
      else res = this.execExpression(right)
    } else if (op === "!")
      res = new this.builtIns.Boolean(!right.func("toBoolean").value)
      // EQUALITY
    else if (op === "==")
      res = new this.builtIns.Boolean(left === right || left.value === right.value)
    else if (op === "!=")
      res = new this.builtIns.Boolean(left !== right && left.value !== right.value)
    else if (op === "~=")
      res = new this.builtIns.Boolean(left === right || left.func("toString").value === right.func("toString").value)
    else if (op === "<") {
      if (left.is("Number") && right.is("Number")) res = new this.builtIns.Boolean(left.value < right.value)
      else error(`Invalid types ${left.name} and ${right.name} for '<' operator.`)
    } else if (op === ">") {
      if (left.is("Number") && right.is("Number")) res = new this.builtIns.Boolean(left.value > right.value)
      else error(`Invalid types ${left.name} and ${right.name} for '>' operator.`)
    } else if (op === "<=") {
      if (left.is("Number") && right.is("Number")) res = new this.builtIns.Boolean(left.value <= right.value)
      else error(`Invalid types ${left.name} and ${right.name} for '<=' operator.`)
    } else if (op === ">=") {
      if (left.is("Number") && right.is("Number")) res = new this.builtIns.Boolean(left.value >= right.value)
      else error(`Invalid types ${left.name} and ${right.name} for '>=' operator.`)
      // ASSIGNMENT
    } else if (isAssignment) {
      if (left.type === "identifier") {
        this.currentEnv.setValue(left.value, right)

        res = right
      } else if (left.type === "operation" && left.op === ".") {
        var key = left.right

        if (key.type !== "identifier" && !key.parentheses)
          error("Invalid right side of lookup expression.")

        if (key.parentheses) key = this.execExpression(key).func("toString")

        this.execExpression(left.left).setValue(key.value, right)

        res = right
      } else if (left.type === "operation" && left.op === "[") {
        this.execExpression(left.left).squareBracketSet(this.execExpression(left.extra), right)

        res = right
      } else error("Left side of assignment expression is not a reference.", false, true)
      // LOOKUP
    } else if (op === ".") {
      if (right.type !== "identifier" && !right.parentheses)
        error("Invalid right side of lookup expression.")

      if (right.parentheses) right = this.execExpression(right).func("toString")

      res = left.getValue(right.value, true)
    } else if (op === "[")
      res = left.squareBracketGet(this.execExpression(ast.extra))
    else {
      error(`Operator '${op}' is currently not implemented, it will be replaced with a null.`, true, true)
      res = new this.builtIns.Null()
    }

    if (retLeft) return [res, left]
    else return res
  }

  execFuncCall(func, params, thisArg = null) {
    if (!(func instanceof this.builtIns.Function))
      error(`Cannot call non-function value ${func.func("toString").value}.`, false, true)

    return func.call(thisArg, params.map(x => this.execExpression(x)))
  }

  execFuncDecl(ast) {
    var fn = new this.builtIns.Function(ast.params, ast.body, this.currentEnv, null, ast.cache)

    if (ast.name) this.currentEnv.setValue(ast.name, fn, false)

    return fn
  }

  execClass(ast) {
    var classContents = [[], [], [], []] // methods, fields, static methods, static fields

    for (let i of ast.contents) {
      var index = i.type === "field\n" ? 1 : 0

      if (i.isStatic) {
        if (i.type === "field")
          classContents[index + 2].push({
            name : i.name,
            value : this.execExpression(i.value)
          })
        else
          classContents[index + 2].push({
            name : i.name,
            value : new this.builtIns.Function(i.params, i.body, this.currentEnv, null, false /* TODO cache static class methods */)
          })
      } else classContents[index].push(i)
    }

    var superclass = ast.superclass ? this.execExpression(ast.superclass) : null

    if (superclass && !(superclass instanceof this.builtIns.Class))
      error(`The superclass specified for class '${ast.name}' is not a class.`, false, true)

    var cl = new this.builtIns.Class(ast.name, ...classContents, superclass)

    this.currentEnv.setValue(ast.name, cl, false)

    return cl
  }

  execIf(ast) {
    var cond = this.execExpression(ast.condition).func("toBoolean").value

    if (cond) this.execBlock(ast.body)

    if (ast.ifOr && (cond || this.execExpression(ast.ifOr.condition).func("toBoolean").value))
      this.execBlock(ast.ifOr.body)

    if (ast.else && !cond) this.execBlock(ast.else)

    if (ast.elseOr && (!cond || this.execExpression(ast.elseOr.condition).func("toBoolean").value))
      this.execBlock(ast.elseOr.body)
  }

  execLoop(ast) {
    var times = this.execExpression(ast.times)
    if (!times.is("Number") || times.value < 0 || !Number.isInteger(times.value))
      error("Times to loop for loop statement must be a positive integer.", false, true)

    for (let i = 0; i < times.value; i++) this.execBlock(ast.body)
  }
}

class Environment { // is the executor instance if global, otherwise false
  constructor(parent, execIfGlobal = false) {
    this.parent = parent

    this.content = {}

    if (execIfGlobal) {
      var result = fillGlobalEnv(this.content, execIfGlobal, {
        canvas : execIfGlobal.canvasElem
      })

      execIfGlobal.builtIns = this.builtIns = result.builtIns

      execIfGlobal._stop = result.stop
    }
  }

  setValue(name, value, canExist = true, reportResult = false) {
    if (!canExist && this.valueExists(name)) error(`Cannot create namespace ${name} because it already exists.`, false, true)

    if (name in this.content)
      this.content[name] = value
    else if (this.parent) {
      var result = this.parent.setValue(name, value, canExist, true)

      if (result === false) {
        if (reportResult) return false

        this.content[name] = value
      }
    } else if (reportResult) return false

    this.content[name] = value
  }

  setThisValue(name, value) {
    this.content[name] = value
  }

  getValue(name, mustExist = false) {
    if (name in this.content) return this.content[name]
    else if (this.parent) return this.parent.getValue(name, mustExist)
    else if (mustExist) error(`Namespace ${name} does not exist.`, false, true)

    return new this.builtIns.Null()
  }

  valueExists(name) {
    if (name in this.content) return true
    else if (this.parent) return this.parent.valueExists(name)

    return false
  }
}
