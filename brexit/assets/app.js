(function(){

	// Get the Distilled object or create it
	this.Distilled = this.Distilled || {};



/******************************************/
/*	Events Internal functions (Private)
/******************************************/


	// Regular expression used to split event strings.
	var eventSplitter = /\s+/;


	// Iterates over the standard `event, callback` (as well as the fancy multiple
	// space-separated events `"change blur", callback` and jQuery-style event
	// maps `{event: callback}`).
	var eventsApi = function(iteratee, events, name, callback, opts) {
		var i = 0, names;
		if (name && typeof name === 'object') {
			// Handle event maps.
			if (callback !== void 0 && 'context' in opts && opts.context === void 0) opts.context = callback;
			for (names = _.keys(name); i < names.length ; i++) {
				events = eventsApi(iteratee, events, names[i], name[names[i]], opts);
			}
		} else if (name && eventSplitter.test(name)) {
			// Handle space-separated event names by delegating them individually.
			for (names = name.split(eventSplitter); i < names.length; i++) {
				events = iteratee(events, names[i], callback, opts);
			}
		} else {
			// Finally, standard events.
			events = iteratee(events, name, callback, opts);
		}
		return events;
	};



	// Guard the `listening` argument from the public API.
	var internalOn = function(obj, name, callback, context, listening) {
		obj._events = eventsApi(onApi, obj._events || {}, name, callback, {
			context: context,
			ctx: obj,
			listening: listening
		});

		if (listening) {
			var listeners = obj._listeners || (obj._listeners = {});
			listeners[listening.id] = listening;
		}

		return obj;
	};



	// The reducing API that adds a callback to the `events` object.
	var onApi = function(events, name, callback, options) {
		if (callback) {
			var handlers = events[name] || (events[name] = []);
			var context = options.context, ctx = options.ctx, listening = options.listening;
			if (listening) listening.count++;

			handlers.push({callback: callback, context: context, ctx: context || ctx, listening: listening});
		}
		return events;
	};



	// The reducing API that removes a callback from the `events` object.
	var offApi = function(events, name, callback, options) {
		if (!events) return;

		var i = 0, listening;
		var context = options.context, listeners = options.listeners;

		// Delete all events listeners and "drop" events.
		if (!name && !callback && !context) {
			var ids = _.keys(listeners);
			for (; i < ids.length; i++) {
				listening = listeners[ids[i]];
				delete listeners[listening.id];
				delete listening.listeningTo[listening.objId];
			}
			return;
		}

		var names = name ? [name] : _.keys(events);
		for (; i < names.length; i++) {
			name = names[i];
			var handlers = events[name];

			// Bail out if there are no events stored.
			if (!handlers) break;

			// Replace events if there are any remaining.  Otherwise, clean up.
			var remaining = [];
			for (var j = 0; j < handlers.length; j++) {
				var handler = handlers[j];
				if (
					callback && callback !== handler.callback &&
						callback !== handler.callback._callback ||
							context && context !== handler.context
				) {
					remaining.push(handler);
				} else {
					listening = handler.listening;
					if (listening && --listening.count === 0) {
						delete listeners[listening.id];
						delete listening.listeningTo[listening.objId];
					}
				}
			}

			// Update tail event if the list has any events.  Otherwise, clean up.
			if (remaining.length) {
				events[name] = remaining;
			} else {
				delete events[name];
			}
		}
		return events;
	};



	// Reduces the event callbacks into a map of `{event: onceWrapper}`.
	// `offer` unbinds the `onceWrapper` after it has been called.
	var onceMap = function(map, name, callback, offer) {
		if (callback) {
			var once = map[name] = _.once(function() {
				offer(name, once);
				callback.apply(this, arguments);
			});
			once._callback = callback;
		}
		return map;
	};



	// Handles triggering the appropriate event callbacks.
	var triggerApi = function(objEvents, name, callback, args) {
		if (objEvents) {
			var events = objEvents[name];
			var allEvents = objEvents.all;
			if (events && allEvents) allEvents = allEvents.slice();
			if (events) triggerEvents(events, args);
			if (allEvents) triggerEvents(allEvents, [name].concat(args));
		}
		return objEvents;
	};

	// A difficult-to-believe, but optimized internal dispatch function for
	// triggering events. Tries to keep the usual cases speedy
	var triggerEvents = function(events, args) {
		var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
		switch (args.length) {
			case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
			case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
			case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
			case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
			default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args); return;
		}
	};





/******************************************/
/*	Events
/******************************************/



	var Events = function() {};


	Events.prototype = {


		// Bind an event to a `callback` function. Passing `"all"` will bind
		// the callback to all events fired.
		on : function(name, callback, context) {
			return internalOn(this, name, callback, context);
		},



		// Inversion-of-control versions of `on`. Tell *this* object to listen to
		// an event in another object... keeping track of what it's listening to
		// for easier unbinding later.
		listenTo : function(obj, name, callback) {
			if (!obj) return this;
			var id = obj._listenId || (obj._listenId = _.uniqueId('l'));
			var listeningTo = this._listeningTo || (this._listeningTo = {});
			var listening = listeningTo[id];

			// This object is not listening to any other events on `obj` yet.
			// Setup the necessary references to track the listening callbacks.
			if (!listening) {
				var thisId = this._listenId || (this._listenId = _.uniqueId('l'));
				listening = listeningTo[id] = {obj: obj, objId: id, id: thisId, listeningTo: listeningTo, count: 0};
			}

			// Bind callbacks on obj, and keep track of them on listening.
			internalOn(obj, name, callback, this, listening);
			return this;
		},



		// Remove one or many callbacks. If `context` is null, removes all
		// callbacks with that function. If `callback` is null, removes all
		// callbacks for the event. If `name` is null, removes all bound
		// callbacks for all events.
		off : function(name, callback, context) {
			if (!this._events) return this;
			this._events = eventsApi(offApi, this._events, name, callback, {
				context: context,
				listeners: this._listeners
			});
			return this;
		},



		// Tell this object to stop listening to either specific events ... or
		// to every object it's currently listening to.
		stopListening : function(obj, name, callback) {
			var listeningTo = this._listeningTo;
			if (!listeningTo) return this;

			var ids = obj ? [obj._listenId] : _.keys(listeningTo);

			for (var i = 0; i < ids.length; i++) {
				var listening = listeningTo[ids[i]];

				// If listening doesn't exist, this object is not currently
				// listening to obj. Break out early.
				if (!listening) break;

				listening.obj.off(name, callback, this);
			}

			return this;
		},



		// Trigger one or many events, firing all bound callbacks. Callbacks are
		// passed the same arguments as `trigger` is, apart from the event name
		// (unless you're listening on `"all"`, which will cause your callback to
		// receive the true name of the event as the first argument).
		trigger : function(name) {
			if (!this._events) return this;

			var length = Math.max(0, arguments.length - 1);
			var args = Array(length);
			for (var i = 0; i < length; i++) args[i] = arguments[i + 1];

			eventsApi(triggerApi, this._events, name, void 0, args);
			return this;
		},



		// Bind an event to only be triggered a single time. After the first time
		// the callback is invoked, its listener will be removed. If multiple events
		// are passed in using the space-separated syntax, the handler will fire
		// once for each event, not once for a combination of all events.
		once : function(name, callback, context) {
			// Map the event into a `{event: once}` object.
			var events = eventsApi(onceMap, {}, name, callback, _.bind(this.off, this));
			if (typeof name === 'string' && context == null) callback = void 0;
			return this.on(events, callback, context);
		},



		// Inversion-of-control versions of `once`.
		listenToOnce : function(obj, name, callback) {
			// Map the event into a `{event: once}` object.
			var events = eventsApi(onceMap, {}, name, callback, _.bind(this.stopListening, this, obj));
			return this.listenTo(obj, events);
		},


	};



	Distilled.Events = Events;

	return Events;

}())

(function(){


	// Get the Distilled object or create it
	this.Distilled = this.Distilled || {};


	// Create the class
	var Sharing = function( fbID )
	{
		this.mFBID = fbID;

		// Initalise the class
		this._init();
	}


	/*

		Events:

	*/


	// Add the properties to the class
	Sharing.prototype = {


	/******************************************/
	/*	Public Vars
	/******************************************/

		hide : function()
		{
			var embed = document.getElementById( "shareEmbed" );
			$d.removeClass( embed, "shareEmbedOn" );

			var methodology = document.getElementById( "methodology" );
			$d.removeClass( methodology, "methodologyOn" );
		},



	/******************************************/
	/*	Private Vars
	/******************************************/

		mFacebookText : null,
		mTwitterText : null,



	/******************************************/
	/*	Public Functions
	/******************************************/

		updateTwitterText : function( text )
		{
			var links = document.getElementsByClassName( "share-link-twitter" );
			var total = links.length;
			var parent, title, a, href;

			for ( var i=0; i<total; i++ )
			{
				href = null;

				// Get the Parent element
				parent = links[i].parentNode;

				// Get the text from the element
				title = parent.textContent;

				// Set the text as the title attribute
				parent.setAttribute( "title", title );

				// Set the servive
				// service = parent.getAttribute( "data-service" );


				var twitterURL = this._getMetaContent( "og:url" );
				var twitterSite = this._getMetaContent( "twitter:site" );
				twitterSite = twitterSite.replace('@', '');

				if ( parent.getAttribute( 'data-text' ) != '' ) {
					t = parent.getAttribute( 'data-text' );
				}

				href = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent( twitterURL ) + '&related=' + encodeURIComponent( twitterSite );

				a = parent.getElementsByTagName( "a" );

				if ( href )
				{
					a[0].setAttribute( 'target', '_blank' )
					a[0].setAttribute( 'href', href );
				}
			}
		},



		updateFacebookText : function( text )
		{
			this.mFacebookText = text;
		},




	/******************************************/
	/*	Private Functions
	/******************************************/


		_init : function()
		{
			// ancient browsers
			if (window.attachEvent && !window.addEventListener) {
				return;
			}

			// Setup the links
			this._setup();

			// Add the event listeners
			this._addEventListeners();
		},



		_setup : function()
		{

			var url = this._getMetaContent( "og:url" );
			var title = this._getMetaContent( "og:title" );
			var description = this._getMetaContent( "og:description" );

			var share = document.getElementById( "share" );


			var links = document.getElementsByClassName( "share-link" );

			// var lis = share.getElementsByTagName( "li" );

			var total = links.length;
			var parent, title, service, href;

			// Loop through the LI elements
			for ( var i=0; i<total; i++ )
			{
				href = null;

				// Get the Parent element
				parent = links[i].parentNode;

				// Get the text from the element
				title = parent.textContent;

				// Set the text as the title attribute
				parent.setAttribute( "title", title );

				// Set the servive
				service = parent.getAttribute( "data-service" );

				switch( service )
				{
					case 'facebook':
						if ( this.mFBID )
						{
							var facebookURL = this._getMetaContent( "og:url" );
							href = facebookURL;
						}
						else
						{
							var facebookURL = this._getMetaContent( "og:url" );
							href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent( facebookURL );
						}
						break;



					case 'twitter':
						var twitterURL = this._getMetaContent( "og:url" );
						var twitterSite = this._getMetaContent( "twitter:site" );
						twitterSite = twitterSite.replace('@', '');

						var t = this._getMetaContent( "twitter:title" );

						if ( parent.getAttribute( 'data-text' ) != '' ) {
							t = parent.getAttribute( 'data-text' );
						}

						href = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(t) + '&url=' + encodeURIComponent( twitterURL ) + '&related=' + encodeURIComponent( twitterSite );
						break;



					case 'linkedIn':
						href = 'http://www.linkedin.com/shareArticle?mini=true&url=' + encodeURIComponent( url ) + '&title=' + encodeURIComponent( title ) + '&summary=' + encodeURIComponent( description );
						break;



					case 'pinterest':
						var m = this._getMetaContent( "og:image" );

						if ( parent.getAttribute( 'data-media-url' ) != '' ) {
							m = parent.getAttribute( 'data-media-url' );
						}

						href = 'https://pinterest.com/pin/create/button/?url=' + encodeURIComponent( url ) + '&media=' + encodeURIComponent(m) + '&description=' + encodeURIComponent( description );
						break;



					case 'email':
						href = 'mailto:%20?subject=' + encodeURIComponent( title ) + '&body=' + encodeURIComponent('\n' + description + ' \n\n' + url );
						break;



					case 'embed':
						this._createEmbed( parent );
						break;


					// case 'methodology' :
					// 	this._createMethodology( li );
					// 	break;
				}


				var a = parent.getElementsByTagName( "a" );

				if ( href )
				{
					a[0].setAttribute( 'target', '_blank' )
					a[0].setAttribute( 'href', href );
				}
			}
		},



		_createEmbed : function( el )
		{
			// Create the wrapper
			var wrapper= document.createElement('div');

			// Add the HTML to the wrapper
			wrapper.innerHTML = '<div class="share_embed_inner"><h5 class="shareEmbedTitle"></h5><textarea readonly="true"></textarea><a class="shareEmbedDownload"></a><a class="shareEmbedClose">Close</a></div>';

			// Add the ID and classname to the wrapper
			wrapper.id = "shareEmbed"
			wrapper.className = "share_embed"

			// Get the text and the markup from the LI element
			var text = el.getAttribute( "data-text" );
			var markup = el.getAttribute( "data-markup" );

			// Get the title div from the wrapper
			var div = wrapper.getElementsByTagName( "h5" )[0];

			// Add the text to the wrapper
			div.innerText = text;

			// Get the textarea from the wrapper
			var textArea = wrapper.getElementsByTagName( "textarea" )[0]

			// Add the markup to it
			textArea.value = markup;

			// Listen for the focus event
			textArea.addEventListener( "focus", function(){
				setTimeout( function(){
					textArea.setSelectionRange( 0, 9999 );
				}, 200 );
			})

			// Add the wrapper to the body
			document.body.appendChild( wrapper );

			// Get a reference to the embed element
			var embed = document.getElementById( "shareEmbed" );

			// Get the download text and URL from the LI element
			var downloadUrl = el.getAttribute( 'data-download-url' );
			var downloadText = el.getAttribute( 'data-download-text' );

			// A holder for the a element
			var a;

			// Check to see if we have a download url or text
			if (( downloadUrl != '' ) && ( downloadText != '' ))
			{
				// If we do then get the download a element
				a = embed.getElementsByClassName( "shareEmbedDownload" )[0];

				// Add the text to the a
				a.innerHTML = downloadText;

				// Set the href
				a.setAttribute( "href", downloadUrl );
			}

			// Set a pointer to this class
			var self = this;

			// Get the close button from the embed
			a = embed.getElementsByClassName( "shareEmbedClose" )[0];

			// Add the click listener so that we can close the embed
			a.addEventListener( "click", function(e){
				$d.toggleClass( embed, "shareEmbedOn" );
				return false;
			});
		},



		_getMetaContent : function( key )
		{
			var metaTags=document.getElementsByTagName("meta");

			for (var i = 0; i < metaTags.length; i++)
			{
				if ( metaTags[i].getAttribute("property") == key )
					return metaTags[i].getAttribute("content");

				if ( metaTags[i].getAttribute("name") == key )
					return metaTags[i].getAttribute("content");
			}

			return null;
		},



		_addEventListeners : function()
		{
			// var share = document.getElementById( "share" );
			// var as = share.getElementsByTagName( "a" );

			var links = document.getElementsByClassName( "share-link" );
			var total = links.length;
			var link, service;
			var self = this;

			for ( var i=0; i<total; i++ )
			{
				link = links[i];
				link.addEventListener( "click", function( e ){ return self._onSharingBtnClick( e ); } )
			}
		},




	/******************************************/
	/*	EVENT HANDLERS
	/******************************************/

		_onSharingBtnClick : function( e )
		{
			Distilled.log( "[Sharing] BTN CLICK:", e.target );

			e.preventDefault();

			// Get the target
			var target = e.target;

			// Check to see if the target has the share link if it doesnt then check the parent
			if ( !$d.hasClass( target, "share-link" ))
			{
				target = e.target.parentNode;
			}

			// Get the parent from the target
			var parent = target.parentNode

			// Get the service
			service = parent.getAttribute( "data-service" );

			Distilled.log( "[Sharing] SERVICE:", service );

			// Switch bewteen the services
			switch( service )
			{
				case 'facebook':

					var href = target.getAttribute( "href" );

					Distilled.log( "[Sharing] FB HREF:", href )

					if ( window.FB )
					{
						// FB Share Dialog docs
						// https://developers.facebook.com/docs/sharing/reference/share-dialog/
						FB.ui({
							method: 'share',
							href: href,
							// hashtag: "#",
							quote: this.mFacebookText,
						}, function(response){
							Distilled.log( "[Sharing] FB SHARE COMPLETE:", response );
						});

						Distilled.log( "[Sharing] SHOW FACEBOOK UI" );
					}
					else
					{
						window.open( href, '_blank', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, copyhistory=no, width=600, height=500');
					}

					return false;
					break;


				case 'twitter':
					var href = target.getAttribute( "href" );
					window.open( href, '_blank', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, copyhistory=no, width=550, height=420');
					return false;
					break;


				case 'linkedIn':
					return false;
					break;


				case 'pinterest':
					return false;
					break;


				case 'email':
					break;


				case 'embed':
					var embed = document.getElementById( "shareEmbed" );
					$d.toggleClass( embed, "shareEmbedOn" );
					break;


				case 'methodology' :
					var methodology = document.getElementById( "methodology" );
					$d.toggleClass( methodology, "methodologyOn" );

					// Distilled.core.toggleMethodology();
					break;
			}
		},



	/******************************************/
	/*	Getters / Setters
	/******************************************/


	};

	// Assign the class to the Distilled object
	this.Distilled.Sharing = Sharing;

	// Return the class
	return Sharing;

}());

(function(){


	// Get the Distilled object or create it
	this.Distilled = this.Distilled || {};


	// Create the class
	var Data = function( settings )
	{
		this.mSettings = settings;

		// Initalise the class
		this._init();
	}


	// Data.prototype = Object.create( Distilled.Events.prototype );
	// Data.prototype.constructor = Data;



	// Add the properties to the class
	// Object.assign( Data.prototype, {

	Data.prototype = {


	/******************************************/
	/*	Public Vars
	/******************************************/

		data: null,
		verticies: null,
		width: null,
		height: null,
		min: null,
		max: null,

		minY: null,
		maxY: null,

		bounds: null,

		milestones: null,



	/******************************************/
	/*	Private Vars
	/******************************************/


	/******************************************/
	/*	Public Functions
	/******************************************/


	/******************************************/
	/*	Private Functions
	/******************************************/

		_init : function()
		{
			this.width = this.mSettings.data.valueXSpace * this.mSettings.scaler;
			this.height = this.mSettings.data.valueYMultiplier * this.mSettings.scaler;
			this.offsetX = this.mSettings.data.positionOffsetX;
			this.offsetY = this.mSettings.data.positionOffsetY;

			this._parse([
				// {"date":"03/02/2015","value":1.32147237},
				// {"date":"04/02/2015","value":1.3410073},
				// {"date":"05/02/2015","value":1.33574953},
				// {"date":"06/02/2015","value":1.34631116},
				// {"date":"07/02/2015","value":1.34631116},
				// {"date":"08/02/2015","value":1.34659273},
				// {"date":"09/02/2015","value":1.3436133},
				// {"date":"10/02/2015","value":1.34800566},
				// {"date":"11/02/2015","value":1.34767387},
				// {"date":"12/02/2015","value":1.34957646},
				// {"date":"13/02/2015","value":1.35193345},
				// {"date":"14/02/2015","value":1.35193345},
				// {"date":"15/02/2015","value":1.35126955},
				// {"date":"16/02/2015","value":1.35486661},
				// {"date":"17/02/2015","value":1.34630866},
				// {"date":"18/02/2015","value":1.35400493},
				// {"date":"19/02/2015","value":1.35660774},
				// {"date":"20/02/2015","value":1.35249749},
				// {"date":"21/02/2015","value":1.35249749},
				// {"date":"22/02/2015","value":1.35211701},
				// {"date":"23/02/2015","value":1.36348195},
				// {"date":"24/02/2015","value":1.36305994},
				// {"date":"25/02/2015","value":1.36632949},
				// {"date":"26/02/2015","value":1.3759758},
				// {"date":"27/02/2015","value":1.37895814},
				// {"date":"28/02/2015","value":1.37895814},
				// {"date":"01/03/2015","value":1.38030088},
				// {"date":"02/03/2015","value":1.37412875},
				// {"date":"03/03/2015","value":1.37417841},
				// {"date":"04/03/2015","value":1.37759385},
				// {"date":"05/03/2015","value":1.38207834},
				// {"date":"06/03/2015","value":1.38672989},
				// {"date":"07/03/2015","value":1.38672989},
				// {"date":"08/03/2015","value":1.38850033},
				// {"date":"09/03/2015","value":1.3940731},
				// {"date":"10/03/2015","value":1.40810457},
				// {"date":"11/03/2015","value":1.41601409},
				// {"date":"12/03/2015","value":1.40149653},
				// {"date":"13/03/2015","value":1.40470667},
				// {"date":"14/03/2015","value":1.40470667},
				// {"date":"15/03/2015","value":1.40735619},
				// {"date":"16/03/2015","value":1.40226548},
				// {"date":"17/03/2015","value":1.3920809},
				// {"date":"18/03/2015","value":1.37905804},
				// {"date":"19/03/2015","value":1.38345207},
				// {"date":"20/03/2015","value":1.38191437},
				// {"date":"21/03/2015","value":1.38191437},
				// {"date":"22/03/2015","value":1.3804256},
				// {"date":"23/03/2015","value":1.36564925},
				// {"date":"24/03/2015","value":1.36044022},
				// {"date":"25/03/2015","value":1.3574505},
				// {"date":"26/03/2015","value":1.36477009},
				// {"date":"27/03/2015","value":1.36582379},
				// {"date":"28/03/2015","value":1.36582379},
				// {"date":"29/03/2015","value":1.36741241},
				// {"date":"30/03/2015","value":1.36759484},
				// {"date":"31/03/2015","value":1.38089984},
				// {"date":"01/04/2015","value":1.37736997},
				// {"date":"02/04/2015","value":1.36413649},
				// {"date":"03/04/2015","value":1.36952604},
				// {"date":"04/04/2015","value":1.36952604},
				// {"date":"05/04/2015","value":1.35723572},
				// {"date":"06/04/2015","value":1.36183213},
				// {"date":"07/04/2015","value":1.36956543},
				// {"date":"08/04/2015","value":1.37929637},
				// {"date":"09/04/2015","value":1.37964591},
				// {"date":"10/04/2015","value":1.38218844},
				// {"date":"11/04/2015","value":1.38218844},
				// {"date":"13/04/2015","value":1.38719454},
				// {"date":"14/04/2015","value":1.38741374},
				// {"date":"15/04/2015","value":1.38894561},
				// {"date":"16/04/2015","value":1.38719682},
				// {"date":"17/04/2015","value":1.38309307},
				// {"date":"18/04/2015","value":1.38309307},
				// {"date":"19/04/2015","value":1.38459765},
				// {"date":"20/04/2015","value":1.3869675},
				// {"date":"21/04/2015","value":1.39038711},
				// {"date":"22/04/2015","value":1.40220995},
				// {"date":"23/04/2015","value":1.39183009},
				// {"date":"24/04/2015","value":1.39650598},
				// {"date":"25/04/2015","value":1.39650598},
				// {"date":"26/04/2015","value":1.3963098},
				// {"date":"27/04/2015","value":1.39968739},
				// {"date":"28/04/2015","value":1.39794212},
				// {"date":"29/04/2015","value":1.38813398},
				// {"date":"30/04/2015","value":1.3692},
				// {"date":"01/05/2015","value":1.35159184},
				// {"date":"02/05/2015","value":1.35159184},
				// {"date":"03/05/2015","value":1.35404288},
				// {"date":"04/05/2015","value":1.35627732},
				// {"date":"05/05/2015","value":1.35670221},
				// {"date":"06/05/2015","value":1.34397469},
				// {"date":"07/05/2015","value":1.36934987},
				// {"date":"08/05/2015","value":1.37605324},
				// {"date":"09/05/2015","value":1.37605324},
				// {"date":"10/05/2015","value":1.37874364},
				// {"date":"11/05/2015","value":1.39781619},
				// {"date":"12/05/2015","value":1.39661843},
				// {"date":"13/05/2015","value":1.38665025},
				// {"date":"14/05/2015","value":1.38323913},
				// {"date":"15/05/2015","value":1.38061718},
				// {"date":"16/05/2015","value":1.38061718},
				// {"date":"17/05/2015","value":1.37521246},
				// {"date":"18/05/2015","value":1.38301105},
				// {"date":"19/05/2015","value":1.39201947},
				// {"date":"20/05/2015","value":1.40004057},
				// {"date":"21/05/2015","value":1.40954101},
				// {"date":"22/05/2015","value":1.40656796},
				// {"date":"23/05/2015","value":1.40656796},
				// {"date":"24/05/2015","value":1.40786176},
				// {"date":"25/05/2015","value":1.41042991},
				// {"date":"26/05/2015","value":1.41384033},
				// {"date":"27/05/2015","value":1.40847068},
				// {"date":"28/05/2015","value":1.39769348},
				// {"date":"29/05/2015","value":1.40224093},
				// {"date":"30/05/2015","value":1.40224093},
				// {"date":"31/05/2015","value":1.39495227},
				// {"date":"01/06/2015","value":1.39155262},
				// {"date":"02/06/2015","value":1.37551237},
				// {"date":"03/06/2015","value":1.36115805},
				// {"date":"04/06/2015","value":1.37056767},
				// {"date":"05/06/2015","value":1.3747338},
				// {"date":"06/06/2015","value":1.3747338},
				// {"date":"07/06/2015","value":1.37490993},
				// {"date":"08/06/2015","value":1.36021737},
				// {"date":"09/06/2015","value":1.36241739},
				// {"date":"10/06/2015","value":1.37032322},
				// {"date":"11/06/2015","value":1.379471},
				// {"date":"12/06/2015","value":1.38188345},
				// {"date":"13/06/2015","value":1.38188345},
				// {"date":"14/06/2015","value":1.3866676},
				// {"date":"15/06/2015","value":1.3833534},
				// {"date":"16/06/2015","value":1.39111173},
				// {"date":"17/06/2015","value":1.39433238},
				// {"date":"18/06/2015","value":1.396581},
				// {"date":"19/06/2015","value":1.39853026},
				// {"date":"20/06/2015","value":1.39853026},
				// {"date":"21/06/2015","value":1.39679686},
				// {"date":"22/06/2015","value":1.39489259},
				// {"date":"23/06/2015","value":1.40825922},
				// {"date":"24/06/2015","value":1.40180289},
				// {"date":"25/06/2015","value":1.40549685},
				// {"date":"26/06/2015","value":1.41001159},
				// {"date":"27/06/2015","value":1.41001159},
				// {"date":"28/06/2015","value":1.43001461},
				// {"date":"29/06/2015","value":1.40183968},
				// {"date":"30/06/2015","value":1.40864813},
				// {"date":"01/07/2015","value":1.4137653},
				// {"date":"02/07/2015","value":1.40812747},
				// {"date":"03/07/2015","value":1.40102658},
				// {"date":"04/07/2015","value":1.40102658},
				// {"date":"05/07/2015","value":1.4144731},
				// {"date":"06/07/2015","value":1.41196572},
				// {"date":"07/07/2015","value":1.40468735},
				// {"date":"08/07/2015","value":1.38831799},
				// {"date":"09/07/2015","value":1.3897831},
				// {"date":"10/07/2015","value":1.39091662},
				// {"date":"11/07/2015","value":1.39091662},
				// {"date":"12/07/2015","value":1.39406033},
				// {"date":"13/07/2015","value":1.40911665},
				// {"date":"14/07/2015","value":1.42046235},
				// {"date":"15/07/2015","value":1.4284853},
				// {"date":"16/07/2015","value":1.43434001},
				// {"date":"17/07/2015","value":1.44072073},
				// {"date":"18/07/2015","value":1.44072073},
				// {"date":"19/07/2015","value":1.44052813},
				// {"date":"20/07/2015","value":1.43722887},
				// {"date":"21/07/2015","value":1.42227514},
				// {"date":"22/07/2015","value":1.42917232},
				// {"date":"23/07/2015","value":1.41266166},
				// {"date":"24/07/2015","value":1.41325037},
				// {"date":"25/07/2015","value":1.41325037},
				// {"date":"26/07/2015","value":1.41451749},
				// {"date":"27/07/2015","value":1.40333644},
				// {"date":"28/07/2015","value":1.41046003},
				// {"date":"29/07/2015","value":1.42035564},
				// {"date":"30/07/2015","value":1.42622697},
				// {"date":"31/07/2015","value":1.41889257},
				// {"date":"01/08/2015","value":1.41889257},
				// {"date":"02/08/2015","value":1.42434342},
				// {"date":"03/08/2015","value":1.42349459},
				// {"date":"04/08/2015","value":1.42989831},
				// {"date":"05/08/2015","value":1.43110731},
				// {"date":"06/08/2015","value":1.42010519},
				// {"date":"07/08/2015","value":1.41263679},
				// {"date":"08/08/2015","value":1.41263679},
				// {"date":"09/08/2015","value":1.41319125},
				// {"date":"10/08/2015","value":1.41456787},
				// {"date":"11/08/2015","value":1.41152227},
				// {"date":"12/08/2015","value":1.39939497},
				// {"date":"13/08/2015","value":1.39935},
				// {"date":"14/08/2015","value":1.40812766},
				// {"date":"15/08/2015","value":1.40812766},
				// {"date":"16/08/2015","value":1.41046018},
				// {"date":"17/08/2015","value":1.40676212},
				// {"date":"18/08/2015","value":1.42018771},
				// {"date":"19/08/2015","value":1.41038678},
				// {"date":"20/08/2015","value":1.39659091},
				// {"date":"21/08/2015","value":1.37816169},
				// {"date":"22/08/2015","value":1.37816169},
				// {"date":"23/08/2015","value":1.37800106},
				// {"date":"24/08/2015","value":1.36100066},
				// {"date":"25/08/2015","value":1.35854153},
				// {"date":"26/08/2015","value":1.36497719},
				// {"date":"27/08/2015","value":1.37019207},
				// {"date":"28/08/2015","value":1.37670027},
				// {"date":"29/08/2015","value":1.37670027},
				// {"date":"30/08/2015","value":1.3749109},
				// {"date":"31/08/2015","value":1.36868323},
				// {"date":"01/09/2015","value":1.35481844},
				// {"date":"02/09/2015","value":1.36493362},
				// {"date":"03/09/2015","value":1.37151725},
				// {"date":"04/09/2015","value":1.36085996},
				// {"date":"05/09/2015","value":1.36085996},
				// {"date":"06/09/2015","value":1.36263789},
				// {"date":"07/09/2015","value":1.36887241},
				// {"date":"08/09/2015","value":1.37412108},
				// {"date":"09/09/2015","value":1.36883875},
				// {"date":"10/09/2015","value":1.36765866},
				// {"date":"11/09/2015","value":1.36109657},
				// {"date":"12/09/2015","value":1.36109657},
				// {"date":"13/09/2015","value":1.36191255},
				// {"date":"14/09/2015","value":1.36421125},
				// {"date":"15/09/2015","value":1.36129127},
				// {"date":"16/09/2015","value":1.37403296},
				// {"date":"17/09/2015","value":1.36549284},
				// {"date":"18/09/2015","value":1.37334787},
				// {"date":"19/09/2015","value":1.37334787},
				// {"date":"20/09/2015","value":1.37530563},
				// {"date":"21/09/2015","value":1.38586654},
				// {"date":"22/09/2015","value":1.38047753},
				// {"date":"23/09/2015","value":1.36302085},
				// {"date":"24/09/2015","value":1.36216551},
				// {"date":"25/09/2015","value":1.35602346},
				// {"date":"26/09/2015","value":1.35602346},
				// {"date":"27/09/2015","value":1.35735018},
				// {"date":"28/09/2015","value":1.35033329},
				// {"date":"29/09/2015","value":1.34668018},
				// {"date":"30/09/2015","value":1.3537335},
				// {"date":"01/10/2015","value":1.35246374},
				// {"date":"02/10/2015","value":1.35396981},
				// {"date":"03/10/2015","value":1.35396981},
				// {"date":"04/10/2015","value":1.35344133},
				// {"date":"05/10/2015","value":1.35365587},
				// {"date":"06/10/2015","value":1.35140464},
				// {"date":"07/10/2015","value":1.36275752},
				// {"date":"08/10/2015","value":1.36027119},
				// {"date":"09/10/2015","value":1.34934218},
				// {"date":"10/10/2015","value":1.34934218},
				// {"date":"11/10/2015","value":1.34755275},
				// {"date":"12/10/2015","value":1.35072671},
				// {"date":"13/10/2015","value":1.34001674},
				// {"date":"14/10/2015","value":1.34884978},
				// {"date":"15/10/2015","value":1.36099126},
				// {"date":"16/10/2015","value":1.36038439},
				// {"date":"17/10/2015","value":1.36038439},
				// {"date":"18/10/2015","value":1.35891815},
				// {"date":"19/10/2015","value":1.3658074},
				// {"date":"20/10/2015","value":1.36058581},
				// {"date":"21/10/2015","value":1.35900501},
				// {"date":"22/10/2015","value":1.38833252},
				// {"date":"23/10/2015","value":1.38997088},
				// {"date":"24/10/2015","value":1.38997088},
				// {"date":"25/10/2015","value":1.38998438},
				// {"date":"26/10/2015","value":1.38822288},
				// {"date":"27/10/2015","value":1.3876875},
				// {"date":"28/10/2015","value":1.39700798},
				// {"date":"29/10/2015","value":1.39348797},
				// {"date":"30/10/2015","value":1.40412413},
				// {"date":"31/10/2015","value":1.40412413},
				// {"date":"01/11/2015","value":1.40249354},
				// {"date":"02/11/2015","value":1.39993651},
				// {"date":"03/11/2015","value":1.4066235},
				// {"date":"04/11/2015","value":1.41625865},
				// {"date":"05/11/2015","value":1.39727149},
				// {"date":"06/11/2015","value":1.40099651},
				// {"date":"07/11/2015","value":1.40099651},
				// {"date":"08/11/2015","value":1.40128489},
				// {"date":"09/11/2015","value":1.40527002},
				// {"date":"10/11/2015","value":1.40934364},
				// {"date":"11/11/2015","value":1.41435022},
				// {"date":"12/11/2015","value":1.40822934},
				// {"date":"13/11/2015","value":1.41443079},
				// {"date":"14/11/2015","value":1.41443079},
				// {"date":"15/11/2015","value":1.41307956},
				// {"date":"16/11/2015","value":1.42241042},
				// {"date":"17/11/2015","value":1.42980976},
				// {"date":"18/11/2015","value":1.42850247},
				// {"date":"19/11/2015","value":1.42524133},
				// {"date":"20/11/2015","value":1.42663295},
				// {"date":"21/11/2015","value":1.42663295},
				// {"date":"22/11/2015","value":1.42639814},
				// {"date":"23/11/2015","value":1.42231891},
				// {"date":"24/11/2015","value":1.41694625},
				// {"date":"25/11/2015","value":1.42353745},
				// {"date":"26/11/2015","value":1.42404288},
				// {"date":"27/11/2015","value":1.41907033},
				// {"date":"28/11/2015","value":1.41907033},
				// {"date":"29/11/2015","value":1.41957535},
				// {"date":"30/11/2015","value":1.42447972},
				// {"date":"01/12/2015","value":1.41902211},
				// {"date":"02/12/2015","value":1.40863257},
				// {"date":"03/12/2015","value":1.38608268},
				// {"date":"04/12/2015","value":1.38847861},
				// {"date":"05/12/2015","value":1.38847861},
				// {"date":"06/12/2015","value":1.38831287},
				// {"date":"07/12/2015","value":1.38916796},
				// {"date":"08/12/2015","value":1.37771157},
				// {"date":"09/12/2015","value":1.37801937},
				// {"date":"10/12/2015","value":1.38474082},
				// {"date":"11/12/2015","value":1.38021466},
				// {"date":"12/12/2015","value":1.38021466},
				// {"date":"13/12/2015","value":1.38243352},
				// {"date":"14/12/2015","value":1.37893567},
				// {"date":"15/12/2015","value":1.37586999},
				// {"date":"16/12/2015","value":1.37727044},
				// {"date":"17/12/2015","value":1.37686183},
				// {"date":"18/12/2015","value":1.37038757},
				// {"date":"19/12/2015","value":1.37038757},
				// {"date":"20/12/2015","value":1.37178168},
				// {"date":"21/12/2015","value":1.36530993},
				// {"date":"22/12/2015","value":1.35361222},
				// {"date":"23/12/2015","value":1.36358642},
				// {"date":"24/12/2015","value":1.36069152},
				// {"date":"25/12/2015","value":1.35192572},
				// {"date":"26/12/2015","value":1.35192572},
				// {"date":"27/12/2015","value":1.35973789},
				// {"date":"28/12/2015","value":1.35743133},
				// {"date":"29/12/2015","value":1.35667998},
				// {"date":"30/12/2015","value":1.35520657},
				// {"date":"31/12/2015","value":1.35809091},

				// {"date":"01/01/2016","value":1.36052862},
				// {"date":"02/01/2016","value":1.36052862},
				// {"date":"03/01/2016","value":1.35679156},
				// {"date":"04/01/2016","value":1.35871358},
				// {"date":"05/01/2016","value":1.36503262},
				// {"date":"06/01/2016","value":1.357365},
				// {"date":"07/01/2016","value":1.33891235},
				// {"date":"08/01/2016","value":1.32953385},
				// {"date":"09/01/2016","value":1.32953385},
				// {"date":"10/01/2016","value":1.32985426},
				// {"date":"11/01/2016","value":1.33964173},
				// {"date":"12/01/2016","value":1.33130593},
				// {"date":"13/01/2016","value":1.32352111},
				// {"date":"14/01/2016","value":1.32854383},
				// {"date":"15/01/2016","value":1.30643764},
				// {"date":"16/01/2016","value":1.30643764},
				// {"date":"17/01/2016","value":1.30791757},
				// {"date":"18/01/2016","value":1.30837318},
				// {"date":"19/01/2016","value":1.29994966},
				// {"date":"20/01/2016","value":1.30550732},
				// {"date":"21/01/2016","value":1.30999126},
				// {"date":"22/01/2016","value":1.32120209},
				// {"date":"23/01/2016","value":1.32120209},
				// {"date":"24/01/2016","value":1.3201232},
				// {"date":"25/01/2016","value":1.31259517},
				// {"date":"26/01/2016","value":1.32030383},
				// {"date":"27/01/2016","value":1.30607928},
				// {"date":"28/01/2016","value":1.31304019},
				// {"date":"29/01/2016","value":1.31517482},
				// {"date":"30/01/2016","value":1.31517482},
				// {"date":"31/01/2016","value":1.31520247},
				// {"date":"01/02/2016","value":1.32346905},
				// {"date":"02/02/2016","value":1.31894628},
				// {"date":"03/02/2016","value":1.31550479},
				// {"date":"04/02/2016","value":1.30200946},
				// {"date":"05/02/2016","value":1.29961052},
				// {"date":"06/02/2016","value":1.29961052},
				// {"date":"07/02/2016","value":1.30005853},
				// {"date":"08/02/2016","value":1.29005275},
				// {"date":"09/02/2016","value":1.28165709},
				// {"date":"10/02/2016","value":1.28732393},
				// {"date":"11/02/2016","value":1.27966772},
				// {"date":"12/02/2016","value":1.28867773},
				// {"date":"13/02/2016","value":1.28867773},
				// {"date":"14/02/2016","value":1.28991698},
				// {"date":"15/02/2016","value":1.29411768},
				// {"date":"16/02/2016","value":1.28320928},
				// {"date":"17/02/2016","value":1.28414791},
				// {"date":"18/02/2016","value":1.28994017},
				// {"date":"19/02/2016","value":1.29404914},
				// {"date":"20/02/2016","value":1.29404914,"event":{"description":"Referendum date announced","image":"event_election"}},
				// {"date":"21/02/2016","value":1.28116791},
				// {"date":"22/02/2016","value":1.28323061},
				// {"date":"23/02/2016","value":1.27045174},
				// {"date":"24/02/2016","value":1.26475531},
				// {"date":"25/02/2016","value":1.26687234},
				// {"date":"26/02/2016","value":1.26898107},
				// {"date":"27/02/2016","value":1.26898107},
				// {"date":"28/02/2016","value":1.26799768},
				// {"date":"29/02/2016","value":1.27917346},
				// {"date":"01/03/2016","value":1.28347892},
				// {"date":"02/03/2016","value":1.29567004},
				// {"date":"03/03/2016","value":1.29449677},
				// {"date":"04/03/2016","value":1.29402445},
				// {"date":"05/03/2016","value":1.29402445},
				// {"date":"06/03/2016","value":1.29218706},
				// {"date":"07/03/2016","value":1.29439458},
				// {"date":"08/03/2016","value":1.29144935},
				// {"date":"09/03/2016","value":1.29284256},
				// {"date":"10/03/2016","value":1.27788967},
				// {"date":"11/03/2016","value":1.26831897},
				// {"date":"12/03/2016","value":1.26831897},
				// {"date":"13/03/2016","value":1.28883166},
				// {"date":"14/03/2016","value":1.28640215},
				// {"date":"15/03/2016","value":1.27448918},
				// {"date":"16/03/2016","value":1.27036912},
				// {"date":"17/03/2016","value":1.27911811},
				// {"date":"18/03/2016","value":1.28425658},
				// {"date":"19/03/2016","value":1.28425658},
				// {"date":"20/03/2016","value":1.28343989},
				// {"date":"21/03/2016","value":1.27859564},
				// {"date":"22/03/2016","value":1.26713443},
				// {"date":"23/03/2016","value":1.26244971},
				// {"date":"24/03/2016","value":1.26573068},
				// {"date":"25/03/2016","value":1.26583108},
				// {"date":"26/03/2016","value":1.26583108},
				// {"date":"27/03/2016","value":1.26605},
				// {"date":"28/03/2016","value":1.27323457},
				// {"date":"29/03/2016","value":1.27413646},
				// {"date":"30/03/2016","value":1.26817711},
				// {"date":"31/03/2016","value":1.26224686},
				{"date":"01/04/2016","value":1.248914},
				{"date":"02/04/2016","value":1.248914},
				{"date":"03/04/2016","value":1.24822294},
				{"date":"04/04/2016","value":1.25262376},
				{"date":"05/04/2016","value":1.24373959},
				{"date":"06/04/2016","value":1.2396177},
				{"date":"07/04/2016","value":1.23593827},
				{"date":"08/04/2016","value":1.23881784},
				{"date":"09/04/2016","value":1.23881784},
				{"date":"10/04/2016","value":1.23894956},
				{"date":"11/04/2016","value":1.24714779},
				{"date":"12/04/2016","value":1.2532748},
				{"date":"13/04/2016","value":1.25812459},
				{"date":"14/04/2016","value":1.25514738},
				{"date":"15/04/2016","value":1.25881946},
				{"date":"16/04/2016","value":1.25881946},
				{"date":"17/04/2016","value":1.25495029},
				{"date":"18/04/2016","value":1.26315003},
				{"date":"19/04/2016","value":1.26660798},
				{"date":"20/04/2016","value":1.26858086},
				{"date":"21/04/2016","value":1.26852362},
				{"date":"22/04/2016","value":1.28328991, "start":true},
				{"date":"23/04/2016","value":1.28328991},
				{"date":"24/04/2016","value":1.28617223},
				{"date":"25/04/2016","value":1.28589186},
				{"date":"26/04/2016","value":1.29015981},
				{"date":"27/04/2016","value":1.28344446},
				{"date":"28/04/2016","value":1.2863621},
				{"date":"29/04/2016","value":1.27631697},
				{"date":"30/04/2016","value":1.27631697},
				{"date":"01/05/2016","value":1.27405},
				{"date":"02/05/2016","value":1.2725419},
				{"date":"03/05/2016","value":1.26500893},
				{"date":"04/05/2016","value":1.26203118},
				{"date":"05/05/2016","value":1.27091379},
				{"date":"06/05/2016","value":1.2653339},
				{"date":"07/05/2016","value":1.2653339},
				{"date":"08/05/2016","value":1.26692436},
				{"date":"09/05/2016","value":1.2662655},
				{"date":"10/05/2016","value":1.27029763},
				{"date":"11/05/2016","value":1.2634212},
				{"date":"12/05/2016","value":1.26973463},
				{"date":"13/05/2016","value":1.26980908},
				{"date":"14/05/2016","value":1.26980908},
				{"date":"15/05/2016","value":1.26792743},
				{"date":"16/05/2016","value":1.27642173},
				{"date":"17/05/2016","value":1.27767712},
				{"date":"18/05/2016","value":1.30071309},
				{"date":"19/05/2016","value":1.30311968},
				{"date":"20/05/2016","value":1.29296479},
				{"date":"21/05/2016","value":1.29296479},
				{"date":"22/05/2016","value":1.29125831},
				{"date":"23/05/2016","value":1.29138432},
				{"date":"24/05/2016","value":1.31195407},
				{"date":"25/05/2016","value":1.31745258},
				{"date":"26/05/2016","value":1.31035586},
				{"date":"27/05/2016","value":1.31546054},
				{"date":"28/05/2016","value":1.31546054},
				{"date":"29/05/2016","value":1.31631419},
				{"date":"30/05/2016","value":1.31256735},
				{"date":"31/05/2016","value":1.30084892},
				{"date":"01/06/2016","value":1.28858702},
				{"date":"02/06/2016","value":1.29181251},
				{"date":"03/06/2016","value":1.27705446},
				{"date":"04/06/2016","value":1.27705446},
				{"date":"05/06/2016","value":1.26757116},
				{"date":"06/06/2016","value":1.27227528},
				{"date":"07/06/2016","value":1.28075739},
				{"date":"08/06/2016","value":1.27292265},
				{"date":"09/06/2016","value":1.27869426},
				{"date":"10/06/2016","value":1.26676182},
				{"date":"11/06/2016","value":1.26676182},
				{"date":"12/06/2016","value":1.26261409},
				{"date":"13/06/2016","value":1.25842748},
				{"date":"14/06/2016","value":1.25945502},
				{"date":"15/06/2016","value":1.26041032},
				{"date":"16/06/2016","value":1.26894046},
				{"date":"17/06/2016","value":1.27341271},
				{"date":"18/06/2016","value":1.27341271},
				{"date":"19/06/2016","value":1.28500288},
				{"date":"20/06/2016","value":1.29594578},
				{"date":"21/06/2016","value":1.30356479},
				{"date":"22/06/2016","value":1.30543049},
				{"date":"23/06/2016","value":1.28415,"event":{"description":"EU referendum","image":"event_referendum"}, "isReferendum":true },
				{"date":"24/06/2016","value":1.23079795},
				{"date":"25/06/2016","value":1.23079795},
				{"date":"26/06/2016","value":1.21658377},
				{"date":"27/06/2016","value":1.20067196},
				{"date":"28/06/2016","value":1.20582397},
				{"date":"29/06/2016","value":1.20956451},
				{"date":"30/06/2016","value":1.20021623},
				{"date":"01/07/2016","value":1.19163274},
				{"date":"02/07/2016","value":1.19163274},
				{"date":"03/07/2016","value":1.19370069},
				{"date":"04/07/2016","value":1.19152952},
				{"date":"05/07/2016","value":1.17155},
				{"date":"06/07/2016","value":1.16418564},
				{"date":"07/07/2016","value":1.16710203},
				{"date":"08/07/2016","value":1.17189275},
				{"date":"09/07/2016","value":1.17189275},
				{"date":"10/07/2016","value":1.17189557},
				{"date":"11/07/2016","value":1.17411951},
				{"date":"12/07/2016","value":1.20003617},
				{"date":"13/07/2016","value":1.18256799,"event":{"description":"Theresa May officially\nbecomes PM","image":"event_new_pm"}},
				{"date":"14/07/2016","value":1.20232318},
				{"date":"15/07/2016","value":1.19548845},
				{"date":"16/07/2016","value":1.19548845},
				{"date":"17/07/2016","value":1.19638177},
				{"date":"18/07/2016","value":1.19831093},
				{"date":"19/07/2016","value":1.19007949},
				{"date":"20/07/2016","value":1.20203789},
				{"date":"21/07/2016","value":1.1995},
				{"date":"22/07/2016","value":1.19485197},
				{"date":"23/07/2016","value":1.19485197},
				{"date":"24/07/2016","value":1.19649013},
				{"date":"25/07/2016","value":1.19235707},
				{"date":"26/07/2016","value":1.19677803},
				{"date":"27/07/2016","value":1.19542346},
				{"date":"28/07/2016","value":1.18740416},
				{"date":"29/07/2016","value":1.18354313},
				{"date":"30/07/2016","value":1.18354313},
				{"date":"31/07/2016","value":1.1834871},
				{"date":"01/08/2016","value":1.18067522},
				{"date":"02/08/2016","value":1.18892061},
				{"date":"03/08/2016","value":1.19514824},
				{"date":"04/08/2016","value":1.17913861},
				{"date":"05/08/2016","value":1.17885817},
				{"date":"06/08/2016","value":1.17885817},
				{"date":"07/08/2016","value":1.17930912},
				{"date":"08/08/2016","value":1.17568337},
				{"date":"09/08/2016","value":1.17041471},
				{"date":"10/08/2016","value":1.16396964},
				{"date":"11/08/2016","value":1.16324702},
				{"date":"12/08/2016","value":1.15710518},
				{"date":"13/08/2016","value":1.15710518},
				{"date":"14/08/2016","value":1.15625423},
				{"date":"15/08/2016","value":1.15194514},
				{"date":"16/08/2016","value":1.15532306},
				{"date":"17/08/2016","value":1.15451007},
				{"date":"18/08/2016","value":1.15979385},
				{"date":"19/08/2016","value":1.15479717},
				{"date":"20/08/2016","value":1.15479717},
				{"date":"21/08/2016","value":1.15608689},
				{"date":"22/08/2016","value":1.16033662},
				{"date":"23/08/2016","value":1.16755167},
				{"date":"24/08/2016","value":1.17542849},
				{"date":"25/08/2016","value":1.16876334},
				{"date":"26/08/2016","value":1.17309767},
				{"date":"27/08/2016","value":1.17309767},
				{"date":"28/08/2016","value":1.17232297},
				{"date":"29/08/2016","value":1.17102266},
				{"date":"30/08/2016","value":1.17423872},
				{"date":"31/08/2016","value":1.1770996},
				{"date":"01/09/2016","value":1.18515048},
				{"date":"02/09/2016","value":1.19185089},
				{"date":"03/09/2016","value":1.19185089},
				{"date":"04/09/2016","value":1.19137469},
				{"date":"05/09/2016","value":1.19374076},
				{"date":"06/09/2016","value":1.19285146},
				{"date":"07/09/2016","value":1.18684938},
				{"date":"08/09/2016","value":1.18090338},
				{"date":"09/09/2016","value":1.18113436},
				{"date":"10/09/2016","value":1.18113436},
				{"date":"11/09/2016","value":1.18080347},
				{"date":"12/09/2016","value":1.1863491},
				{"date":"13/09/2016","value":1.17585348},
				{"date":"14/09/2016","value":1.17974486},
				{"date":"15/09/2016","value":1.17804167},
				{"date":"16/09/2016","value":1.16508345},
				{"date":"17/09/2016","value":1.16508345},
				{"date":"18/09/2016","value":1.16652328},
				{"date":"19/09/2016","value":1.16681581},
				{"date":"20/09/2016","value":1.16424414},
				{"date":"21/09/2016","value":1.16480528},
				{"date":"22/09/2016","value":1.1650156},
				{"date":"23/09/2016","value":1.15481234},
				{"date":"24/09/2016","value":1.15481234},
				{"date":"25/09/2016","value":1.15471574},
				{"date":"26/09/2016","value":1.15270437},
				{"date":"27/09/2016","value":1.15970404},
				{"date":"28/09/2016","value":1.1616903},
				{"date":"29/09/2016","value":1.15564918},
				{"date":"30/09/2016","value":1.15446549},
				{"date":"01/10/2016","value":1.15446549},
				{"date":"02/10/2016","value":1.15112402,"event":{"description":"May's 2016 conference speech","image":"event_speech"}},
				{"date":"03/10/2016","value":1.14703154},
				{"date":"04/10/2016","value":1.13570062},
				{"date":"05/10/2016","value":1.13808955},
				{"date":"06/10/2016","value":1.11225828},
				{"date":"07/10/2016","value":1.11039196},
				{"date":"08/10/2016","value":1.11039196},
				{"date":"09/10/2016","value":1.11079502},
				{"date":"10/10/2016","value":1.10802444},
				{"date":"11/10/2016","value":1.10918711},
				{"date":"12/10/2016","value":1.1067569},
				{"date":"13/10/2016","value":1.10662989},
				{"date":"14/10/2016","value":1.11079719},
				{"date":"15/10/2016","value":1.11079719},
				{"date":"16/10/2016","value":1.11017378},
				{"date":"17/10/2016","value":1.10964129},
				{"date":"18/10/2016","value":1.12120304},
				{"date":"19/10/2016","value":1.12010481},
				{"date":"20/10/2016","value":1.12127994},
				{"date":"21/10/2016","value":1.12350736},
				{"date":"22/10/2016","value":1.12350736},
				{"date":"23/10/2016","value":1.12293764},
				{"date":"24/10/2016","value":1.12415},
				{"date":"25/10/2016","value":1.11826033},
				{"date":"26/10/2016","value":1.1215409},
				{"date":"27/10/2016","value":1.11671335},
				{"date":"28/10/2016","value":1.10959413},
				{"date":"29/10/2016","value":1.10959413},
				{"date":"30/10/2016","value":1.11094429},
				{"date":"31/10/2016","value":1.11491915},
				{"date":"01/11/2016","value":1.10673815},
				{"date":"02/11/2016","value":1.10887299},
				{"date":"03/11/2016","value":1.1223633},
				{"date":"04/11/2016","value":1.12354162},
				{"date":"05/11/2016","value":1.12354162},
				{"date":"06/11/2016","value":1.12104865},
				{"date":"07/11/2016","value":1.12207796},
				{"date":"08/11/2016","value":1.12499436},
				{"date":"09/11/2016","value":1.13724369},
				{"date":"10/11/2016","value":1.15291925},
				{"date":"11/11/2016","value":1.16077938},
				{"date":"12/11/2016","value":1.16077938},
				{"date":"13/11/2016","value":1.16197675},
				{"date":"14/11/2016","value":1.16481405},
				{"date":"15/11/2016","value":1.16088433},
				{"date":"16/11/2016","value":1.16186581},
				{"date":"17/11/2016","value":1.16829377},
				{"date":"18/11/2016","value":1.16673761},
				{"date":"19/11/2016","value":1.16673761},
				{"date":"20/11/2016","value":1.16441393},
				{"date":"21/11/2016","value":1.17429035},
				{"date":"22/11/2016","value":1.16836443},
				{"date":"23/11/2016","value":1.17902207,"event":{"description":"2016 Autumn Statement","image":"event_budget"}},
				{"date":"24/11/2016","value":1.17918093},
				{"date":"25/11/2016","value":1.17837349},
				{"date":"26/11/2016","value":1.17837349},
				{"date":"27/11/2016","value":1.17639498},
				{"date":"28/11/2016","value":1.16851875},
				{"date":"29/11/2016","value":1.17314742},
				{"date":"30/11/2016","value":1.18157702},
				{"date":"01/12/2016","value":1.18071193},
				{"date":"02/12/2016","value":1.19399942},
				{"date":"03/12/2016","value":1.19399942},
				{"date":"04/12/2016","value":1.19848621},
				{"date":"05/12/2016","value":1.18323268},
				{"date":"06/12/2016","value":1.18204129},
				{"date":"07/12/2016","value":1.17369185},
				{"date":"08/12/2016","value":1.18484612},
				{"date":"09/12/2016","value":1.19071072},
				{"date":"10/12/2016","value":1.19071072},
				{"date":"11/12/2016","value":1.19415899},
				{"date":"12/12/2016","value":1.19124619},
				{"date":"13/12/2016","value":1.1912637},
				{"date":"14/12/2016","value":1.19267986},
				{"date":"15/12/2016","value":1.1925123},
				{"date":"16/12/2016","value":1.1948047},
				{"date":"17/12/2016","value":1.1948047},
				{"date":"18/12/2016","value":1.19554902},
				{"date":"19/12/2016","value":1.19082483},
				{"date":"20/12/2016","value":1.18992404},
				{"date":"21/12/2016","value":1.18470325},
				{"date":"22/12/2016","value":1.17686824},
				{"date":"23/12/2016","value":1.17464727},
				{"date":"24/12/2016","value":1.17464727},
				{"date":"25/12/2016","value":1.17579685},
				{"date":"26/12/2016","value":1.17408457},
				{"date":"27/12/2016","value":1.17333913},
				{"date":"28/12/2016","value":1.17343487},
				{"date":"29/12/2016","value":1.16233873},
				{"date":"30/12/2016","value":1.17340622},
				{"date":"31/12/2016","value":1.17340622},
				{"date":"01/01/2017","value":1.17323097},
				{"date":"02/01/2017","value":1.17436066},
				{"date":"03/01/2017","value":1.17531919},
				{"date":"04/01/2017","value":1.17416887},
				{"date":"05/01/2017","value":1.17144482},
				{"date":"06/01/2017","value":1.16731231},
				{"date":"07/01/2017","value":1.16731231},
				{"date":"08/01/2017","value":1.16638979},
				{"date":"09/01/2017","value":1.14945464},
				{"date":"10/01/2017","value":1.15345624},
				{"date":"11/01/2017","value":1.15255041},
				{"date":"12/01/2017","value":1.14574998},
				{"date":"13/01/2017","value":1.14466304},
				{"date":"14/01/2017","value":1.14466304},
				{"date":"15/01/2017","value":1.14453477},
				{"date":"16/01/2017","value":1.13556848},
				{"date":"17/01/2017","value":1.15813588},
				{"date":"18/01/2017","value":1.15342276},
				{"date":"19/01/2017","value":1.15746521},
				{"date":"20/01/2017","value":1.15679444},
				{"date":"21/01/2017","value":1.15679444},
				{"date":"22/01/2017","value":1.15636538},
				{"date":"23/01/2017","value":1.16325112},
				{"date":"24/01/2017","value":1.16790162},
				{"date":"25/01/2017","value":1.1751},
				{"date":"26/01/2017","value":1.179},
				{"date":"27/01/2017","value":1.17296821,"event":{"description":"May meets Trump","image":"event_trump"}},
				{"date":"28/01/2017","value":1.17296821},
				{"date":"29/01/2017","value":1.17296821},
				{"date":"30/01/2017","value":1.1675},
				{"date":"31/01/2017","value":1.1653},
				{"date":"01/02/2017","value":1.1756},
				{"date":"02/02/2017","value":1.1632},
				{"date":"03/02/2017","value":1.15766542},
				{"date":"04/02/2017","value":1.15766542},
				{"date":"05/02/2017","value":1.15766542},
				{"date":"06/02/2017","value":1.1607},
				{"date":"07/02/2017","value":1.17021778},
				{"date":"08/02/2017","value":1.1717},
				{"date":"09/02/2017","value":1.1724753},
				{"date":"10/02/2017","value":1.17333087},
				{"date":"11/02/2017","value":1.17333087},
				{"date":"12/02/2017","value":1.17333087},
				{"date":"13/02/2017","value":1.1814},
				{"date":"14/02/2017","value":1.17891755},
				{"date":"15/02/2017","value":1.17569419},
				{"date":"16/02/2017","value":1.17011014},
				{"date":"17/02/2017","value":1.16934386},
				{"date":"18/02/2017","value":1.16934386},
				{"date":"19/02/2017","value":1.16934386},
				{"date":"20/02/2017","value":1.1755},
				{"date":"21/02/2017","value":1.18455632},
				{"date":"22/02/2017","value":1.18019431},
				{"date":"23/02/2017","value":1.18626297},
				{"date":"24/02/2017","value":1.1797567},
				{"date":"25/02/2017","value":1.1797567},
				{"date":"26/02/2017","value":1.1797567},
				{"date":"27/02/2017","value":1.17500358},
				{"date":"28/02/2017","value":1.1713},
				{"date":"01/03/2017","value":1.1648},
				{"date":"02/03/2017","value":1.1682},
				{"date":"03/03/2017","value":1.15763713},
				{"date":"04/03/2017","value":1.15763713},
				{"date":"05/03/2017","value":1.15763713},
				{"date":"06/03/2017","value":1.15695452},
				{"date":"07/03/2017","value":1.15464312},
				{"date":"08/03/2017","value":1.1544261},
				{"date":"09/03/2017","value":1.1492},
				{"date":"10/03/2017","value":1.14001971},
				{"date":"11/03/2017","value":1.14001971},
				{"date":"12/03/2017","value":1.14001971},
				{"date":"13/03/2017","value":1.146},
				{"date":"14/03/2017","value":1.14563019},
				{"date":"15/03/2017","value":1.14372181},
				{"date":"16/03/2017","value":1.14654416},
				{"date":"17/03/2017","value":1.15301999},
				{"date":"18/03/2017","value":1.15301999},
				{"date":"19/03/2017","value":1.15301999},
				{"date":"20/03/2017","value":1.1518},
				{"date":"21/03/2017","value":1.15411295},
				{"date":"22/03/2017","value":1.1559},
				{"date":"23/03/2017","value":1.16073999},
				{"date":"24/03/2017","value":1.1538284},
				{"date":"25/03/2017","value":1.1538284},
				{"date":"26/03/2017","value":1.1538284},
				{"date":"27/03/2017","value":1.15605876},
				{"date":"28/03/2017","value":1.14823207},
				{"date":"29/03/2017","value":1.15618759,"event":{"description":"Article 50 letter delivered","image":"event_article_50"}},
				{"date":"30/03/2017","value":1.16743863},
				{"date":"31/03/2017","value":1.17623896},
				{"date":"01/04/2017","value":1.17623896},
				{"date":"02/04/2017","value":1.17623896},
				{"date":"03/04/2017","value":1.17062659},
				{"date":"04/04/2017","value":1.16477037},
				{"date":"05/04/2017","value":1.17003237},
				{"date":"06/04/2017","value":1.17140311},
				{"date":"07/04/2017","value":1.16820095},
				{"date":"08/04/2017","value":1.16820095},
				{"date":"09/04/2017","value":1.16938345},
				{"date":"10/04/2017","value":1.17235201},
				{"date":"11/04/2017","value":1.17723014},
				{"date":"12/04/2017","value":1.17593594},
				{"date":"13/04/2017","value":1.17788352},
				{"date":"14/04/2017","value":1.1798182},
				{"date":"15/04/2017","value":1.1798182},
				{"date":"16/04/2017","value":1.1798182},
				{"date":"17/04/2017","value":1.17967029},
				{"date":"18/04/2017","value":1.19718511},
				{"date":"19/04/2017","value":1.19296285},
				{"date":"20/04/2017","value":1.19473614},
				{"date":"21/04/2017","value":1.1948912},
				{"date":"22/04/2017","value":1.1948912},
				{"date":"23/04/2017","value":1.1948912},
				{"date":"24/04/2017","value":1.17603207},
				{"date":"25/04/2017","value":1.17419358},
				{"date":"26/04/2017","value":1.17768921},
				{"date":"27/04/2017","value":1.18659983},
				{"date":"28/04/2017","value":1.18874769},
				{"date":"29/04/2017","value":1.18874769},
				{"date":"30/04/2017","value":1.18874769},
				{"date":"01/05/2017","value":1.18208904},
				{"date":"02/05/2017","value":1.18328536},
				{"date":"03/05/2017","value":1.18185579},
				{"date":"04/05/2017","value":1.1769795},
				{"date":"05/05/2017","value":1.18054107},
				{"date":"06/05/2017","value":1.18054107},
				{"date":"07/05/2017","value":1.18054107},
				{"date":"08/05/2017","value":1.18436832},
				{"date":"09/05/2017","value":1.18934562},
				{"date":"10/05/2017","value":1.1897861},
				{"date":"11/05/2017","value":1.18623169},
				{"date":"12/05/2017","value":1.17885402},
				{"date":"13/05/2017","value":1.17885402},
				{"date":"14/05/2017","value":1.17885402},
				{"date":"15/05/2017","value":1.17499207},
				{"date":"16/05/2017","value":1.16437557},
				{"date":"17/05/2017","value":1.16264065},
				{"date":"18/05/2017","value":1.16611912},
				{"date":"19/05/2017","value":1.16314971},
				{"date":"20/05/2017","value":1.16314971},
				{"date":"21/05/2017","value":1.16314971},
				{"date":"22/05/2017","value":1.15610129},
				{"date":"23/05/2017","value":1.15890697},
				{"date":"24/05/2017","value":1.15550019},
				{"date":"25/05/2017","value":1.15328015},
				{"date":"26/05/2017","value":1.14529695},
				{"date":"27/05/2017","value":1.14529695},
				{"date":"28/05/2017","value":1.14501636},
				{"date":"29/05/2017","value":1.151458},
				{"date":"30/05/2017","value":1.14638625},
				{"date":"31/05/2017","value":1.14550068},
				{"date":"01/06/2017","value":1.14915061},
				{"date":"02/06/2017","value":1.1429159},
				{"date":"03/06/2017","value":1.1429159},
				{"date":"04/06/2017","value":1.14266723},
				{"date":"05/06/2017","value":1.14643575},
				{"date":"06/06/2017","value":1.14501179},
				{"date":"07/06/2017","value":1.1516148},
				{"date":"08/06/2017","value":1.13741792},
				{"date":"09/06/2017","value":1.13883014,"event":{"description":"General Election result","image":"event_election"}},
				{"date":"10/06/2017","value":1.13883014},
				{"date":"11/06/2017","value":1.13794493},
				{"date":"12/06/2017","value":1.13140156},
				{"date":"13/06/2017","value":1.13724969},
				{"date":"14/06/2017","value":1.13764662},
				{"date":"15/06/2017","value":1.14439514},
				{"date":"16/06/2017","value":1.14400539},
				{"date":"17/06/2017","value":1.14400539},
				{"date":"18/06/2017","value":1.14114761},
				{"date":"19/06/2017","value":1.14225476},
				{"date":"20/06/2017","value":1.13439005},
				{"date":"21/06/2017","value":1.13498996},
				{"date":"22/06/2017","value":1.13709138},
				{"date":"23/06/2017","value":1.14325284},
				{"date":"24/06/2017","value":1.14325284},
				{"date":"25/06/2017","value":1.13629666},
				{"date":"26/06/2017","value":1.13774761},
				{"date":"27/06/2017","value":1.12995549},
				{"date":"28/06/2017","value":1.13683289},
				{"date":"29/06/2017","value":1.13718809},
				{"date":"30/06/2017","value":1.15327403},
				{"date":"01/07/2017","value":1.15327403},
				{"date":"02/07/2017","value":1.13980662},
				{"date":"03/07/2017","value":1.1386361},
				{"date":"04/07/2017","value":1.13868231},
				{"date":"05/07/2017","value":1.13964662},
				{"date":"06/07/2017","value":1.13527947},
				{"date":"07/07/2017","value":1.1309927},
				{"date":"08/07/2017","value":1.1309927},
				{"date":"09/07/2017","value":1.13019078},
				{"date":"10/07/2017","value":1.13025932},
				{"date":"11/07/2017","value":1.12048459},
				{"date":"12/07/2017","value":1.12894613},
				{"date":"13/07/2017","value":1.13515413},
				{"date":"14/07/2017","value":1.14168125},
				{"date":"15/07/2017","value":1.14168125},
				{"date":"16/07/2017","value":1.14233405},
				{"date":"17/07/2017","value":1.13756594},
				{"date":"18/07/2017","value":1.12880464},
				{"date":"19/07/2017","value":1.13032922},
				{"date":"20/07/2017","value":1.11493317,"event":{"description":"House of Commons\nsummer recess","image":"event_summer"}},
				{"date":"21/07/2017","value":1.11438891},
				{"date":"22/07/2017","value":1.11438891},
				{"date":"23/07/2017","value":1.11414002},
				{"date":"24/07/2017","value":1.11912027},
				{"date":"25/07/2017","value":1.11854368},
				{"date":"26/07/2017","value":1.11794044},
				{"date":"27/07/2017","value":1.11888773},
				{"date":"28/07/2017","value":1.11749823},
				{"date":"29/07/2017","value":1.11749823},
				{"date":"30/07/2017","value":1.11771967},
				{"date":"31/07/2017","value":1.11616699},
				{"date":"01/08/2017","value":1.11804295},
				{"date":"02/08/2017","value":1.11606129},
				{"date":"03/08/2017","value":1.10616456},
				{"date":"04/08/2017","value":1.10819532},
				{"date":"05/08/2017","value":1.10819532},
				{"date":"06/08/2017","value":1.10748719},
				{"date":"07/08/2017","value":1.10470786},
				{"date":"08/08/2017","value":1.10458937},
				{"date":"09/08/2017","value":1.10614243},
				{"date":"10/08/2017","value":1.10250205},
				{"date":"11/08/2017","value":1.09387626},
				{"date":"12/08/2017","value":1.09387626},
				{"date":"13/08/2017","value":1.10061327},
				{"date":"14/08/2017","value":1.10067516},
				{"date":"15/08/2017","value":1.09585661},
				{"date":"16/08/2017","value":1.09456077},
				{"date":"17/08/2017","value":1.09812629},
				{"date":"18/08/2017","value":1.09022585},
				{"date":"19/08/2017","value":1.09022585},
				{"date":"20/08/2017","value":1.09475835},
				{"date":"21/08/2017","value":1.09198665},
				{"date":"22/08/2017","value":1.09015944},
				{"date":"23/08/2017","value":1.08356962},
				{"date":"24/08/2017","value":1.08513797},
				{"date":"25/08/2017","value":1.08160012},
				{"date":"26/08/2017","value":1.08160012},
				{"date":"27/08/2017","value":1.08030363},
				{"date":"28/08/2017","value":1.08052993},
				{"date":"29/08/2017","value":1.07957729},
				{"date":"30/08/2017","value":1.08658176},
				{"date":"31/08/2017","value":1.08635241},
				{"date":"01/09/2017","value":1.09206968},
				{"date":"02/09/2017","value":1.09206968},
				{"date":"03/09/2017","value":1.09184408},
				{"date":"04/09/2017","value":1.08655264},
				{"date":"05/09/2017","value":1.09363864},
				{"date":"06/09/2017","value":1.09376706},
				{"date":"07/09/2017","value":1.08932954},
				{"date":"08/09/2017","value":1.0969728},
				{"date":"09/09/2017","value":1.0969728},
				{"date":"10/09/2017","value":1.0964151},
				{"date":"11/09/2017","value":1.10113302},
				{"date":"12/09/2017","value":1.11004388},
				{"date":"13/09/2017","value":1.11117658},
				{"date":"14/09/2017","value":1.12385189},
				{"date":"15/09/2017","value":1.13711529},
				{"date":"16/09/2017","value":1.13711529},
				{"date":"17/09/2017","value":1.13738129},
				{"date":"18/09/2017","value":1.12998038},
				{"date":"19/09/2017","value":1.12669366},
				{"date":"20/09/2017","value":1.13652642},
				{"date":"21/09/2017","value":1.13673464},
				{"date":"22/09/2017","value":1.12927789},
				{"date":"23/09/2017","value":1.12927789},
				{"date":"24/09/2017","value":1.12952503},
				{"date":"25/09/2017","value":1.13686789},
				{"date":"26/09/2017","value":1.14071187},
				{"date":"27/09/2017","value":1.14054724},
				{"date":"28/09/2017","value":1.1396563},
				{"date":"29/09/2017","value":1.13416964},
				{"date":"30/09/2017","value":1.13416964},
				{"date":"01/10/2017","value":1.13421089},
				{"date":"02/10/2017","value":1.13129078},
				{"date":"03/10/2017","value":1.12695241},
				{"date":"04/10/2017","value":1.1254944,"event":{"description":"May's 2017 conference speech","image":"event_speech"}},
				{"date":"05/10/2017","value":1.11948776},
				{"date":"06/10/2017","value":1.11416849},
				{"date":"07/10/2017","value":1.11416849},
				{"date":"08/10/2017","value":1.11400932},
				{"date":"09/10/2017","value":1.11927781},
				{"date":"10/10/2017","value":1.11820224},
				{"date":"11/10/2017","value":1.11567152},
				{"date":"12/10/2017","value":1.12115965},
				{"date":"13/10/2017","value":1.1238743},
				{"date":"14/10/2017","value":1.1238743},
				{"date":"15/10/2017","value":1.12389496},
				{"date":"16/10/2017","value":1.12365936},
				{"date":"17/10/2017","value":1.12067284},
				{"date":"18/10/2017","value":1.12000342},
				{"date":"19/10/2017","value":1.11002325},
				{"date":"20/10/2017","value":1.11931735},
				{"date":"21/10/2017","value":1.11931735},
				{"date":"22/10/2017","value":1.11928711},
				{"date":"23/10/2017","value":1.12321895},
				{"date":"24/10/2017","value":1.11646897},
				{"date":"25/10/2017","value":1.12297478},
				{"date":"26/10/2017","value":1.12824923},
				{"date":"27/10/2017","value":1.1308566},
				{"date":"28/10/2017","value":1.1308566},
				{"date":"29/10/2017","value":1.13071195},
				{"date":"30/10/2017","value":1.134},
				{"date":"31/10/2017","value":1.1408},
				{"date":"01/11/2017","value":1.1401},
				{"date":"02/11/2017","value":1.1195},
				{"date":"03/11/2017","value":1.12560785},
				{"date":"04/11/2017","value":1.12560785},
				{"date":"05/11/2017","value":1.12560785},
				{"date":"06/11/2017","value":1.1344},
				{"date":"07/11/2017","value":1.13555454},
				{"date":"08/11/2017","value":1.131},
				{"date":"09/11/2017","value":1.12836593},
				{"date":"10/11/2017","value":1.13078149},
				{"date":"11/11/2017","value":1.13078149},
				{"date":"12/11/2017","value":1.12836593},
				{"date":"13/11/2017","value":1.12486608},
				{"date":"14/11/2017","value":1.1157},
				{"date":"15/11/2017","value":1.11800402},
				{"date":"16/11/2017","value":1.12067578},
				{"date":"17/11/2017","value":1.1208074},
				{"date":"18/11/2017","value":1.1208074},
				{"date":"19/11/2017","value":1.1208074},
				{"date":"20/11/2017","value":1.1283},
				{"date":"21/11/2017","value":1.12843454},
				{"date":"22/11/2017","value":1.12700498, "event":{"description":"2017 Autumn Budget","image":"event_budget"}, "finish":true},
				{"date":"23/11/2017","value":1.12700498}
			])

			this.totalWidth = this.width * this.data.length;
		},



		_parse : function( $data )
		{
			// if ( this.mSettings.data.flipAxis == true )
				this._parseFlipped( $data );
			// else
			// 	this._parseNormal( $data );
		},



		// _parseNormal : function( $data )
		// {

		// 	var verticies = [],
		// 		total = $data.length,
		// 		minMax = this._minMax( $data ),
		// 		offsetX = this.offsetX,
		// 		offsetY = this.offsetY,
		// 		x = 0,
		// 		y = offsetY + (( $data[0].value - minMax.min ) * this.height),
		// 		startY = y + (minMax.min * this.height),
		// 		date, day, month, year;

		// 	Distilled.log( "[Data] MIN MAX:", minMax );

		// 	// Add the start floor
		// 	// verticies.push( x, y-200 );
		// 	verticies.push( x, y );
		// 	// verticies.push( x, startY, x, y );

		// 	// Set the start Y
		// 	this.startY = y;


		// 	for ( var i=0; i<total; i++ )
		// 	{
		// 		// multiply the width by i
		// 		x = ( this.width * i );

		// 		// Add on the X offset
		// 		x += offsetX;

		// 		// Get the data value
		// 		y = $data[i].value;

		// 		// Reduce the value by the min this should then make the min value 0
		// 		y -= minMax.min;

		// 		// Multiply the value by the height
		// 		y *= this.height;

		// 		// Add on the Y offset
		// 		y += offsetY

		// 		// X
		// 		verticies.push( x );

		// 		// Y
		// 		verticies.push( y );

		// 		// Get the date
		// 		date = $data[i].date.split("/");

		// 		// Pull out the day, month and year from the date
		// 		$data[i].day = date[0];
		// 		$data[i].month = date[1];
		// 		$data[i].year = date[2];

		// 		$data[i].x = x;
		// 		$data[i].y = y;
		// 		$data[i].id = i;
		// 	}

		// 	// Add the end floor
		// 	// verticies.push( x+offsetX, y, x+offsetX, startY );
		// 	verticies.push( x+offsetX, y );
		// 	// verticies.push( x+offsetX, y-200 );

		// 	// Distilled.log( "[Data] DATA:", $data );
		// 	Distilled.log( "[Data] VERTICIES:", verticies );

		// 	this.verticies = verticies;
		// 	this.data = $data;
		// 	this.min = minMax.min;
		// 	this.max = minMax.max;

		// 	this.minY = (minMax.min * this.height) - offsetY;
		// 	this.maxY = (minMax.max * this.height) - offsetY;

		// 	this.bounds = {
		// 		x:0,
		// 		y:0,
		// 		width: (this.width * total) + offsetX + offsetX,
		// 		height: minMax.max * this.height
		// 	}
		// },




		_parseFlipped : function( $data )
		{

			var verticies = [],
				total = $data.length,
				minMax = this._minMax( $data ),
				offsetX = this.offsetX,
				offsetY = this.offsetY,
				x = 0,
				y = 0,
				startY = 0,
				date, day, month, year,
				flipped = this.mSettings.data.flipAxis == true ? true : null,
				flippedY = 0,
				milestones = [];


			var minY = 0, maxY = 0;


			// y = offsetY + (( $data[0].value - minMax.min ) * this.height),
			y = $data[0].value;
			y -= minMax.min;


			if ( flipped )
			{
				flippedY = ( minMax.max - minMax.min )
				y = flippedY - y;
			}

			y *= this.height;
			y += offsetY;

			startY = y + (minMax.min * this.height);

			minY = startY;
			// maxY = startY;


			this.finishLine = 0;
			this.startPos = 0;


			// Distilled.log( "[Data] MIN MAX:", minMax );

			// Add the start floor
			// verticies.push( x, y-200 );
			verticies.push( x, y );
			// verticies.push( x, startY, x, y );

			// Set the start Y
			this.startY = y;


			for ( var i=0; i<total; i++ )
			{
				// multiply the width by i
				x = ( this.width * i );

				// Add on the X offset
				x += offsetX;

				// Get the data value
				y = $data[i].value;

				// Reduce the value by the min this should then make the min value 0
				y -= minMax.min;


				if ( flipped )
				{
					// Flip the y so the biggest is the smallest
					y = flippedY - y;
				}


				// Multiply the value by the height
				y *= this.height;

				// Add on the Y offset
				y += offsetY


				x = x|0;
				y = y|0;


				// X
				verticies.push( x );

				// Y
				verticies.push( y );

				// Get the date
				date = $data[i].date.split("/");

				// Pull out the day, month and year from the date
				$data[i].day = date[0];
				$data[i].month = date[1];
				$data[i].year = date[2];

				$data[i].x = x;
				$data[i].y = y;
				$data[i].id = i;

				if ( $data[i].hasOwnProperty( "finish" ))
					this.finishLine = x;

				if ( $data[i].hasOwnProperty( "start" ))
					this.startPos = x;

				if ( $data[i].hasOwnProperty( "event" ))
					milestones.push( $data[i] );

				// Distilled.log( i, "-", y );

				if ( y < minY ) minY = y;
				if ( y > maxY ) maxY = y;
			}

			if ( this.finishLine == 0 )
				this.finishLine = x;

			// Add the end floor
			// verticies.push( x+offsetX, y, x+offsetX, startY );
			verticies.push( x+(offsetX*2), y );
			// verticies.push( x+offsetX, y-200 );

			// Distilled.log( "[Data] DATA:", $data );
			// Distilled.log( "[Data] VERTICIES:", verticies );

			this.verticies = verticies;
			this.data = $data;
			this.min = minMax.min;
			this.max = minMax.max;
			this.minY = minY;
			this.maxY = maxY;
			this.fullHeight = maxY - minY;




			// this.minY = (( flippedY - minMax.min ) * this.height) - offsetY;
			// this.maxY = (( flippedY - minMax.max ) * this.height) - offsetY;

			// this.minY = minMax.min

			// // Flip the y so the biggest is the smallest
			// if ( flipped )
			// 	this.minY = flippedY - this.minY;

			// // Multiply the value by the height
			// this.minY *= this.height;

			// // Add on the Y offset
			// this.minY += offsetY



			// this.maxY = minMax.max

			// // Flip the y so the biggest is the smallest
			// if ( flipped )
			// 	this.maxY = flippedY - this.maxY;

			// // Multiply the value by the height
			// this.maxY *= this.height;

			// // Add on the Y offset
			// this.maxY += offsetY




			// Distilled.log( "[Data] MIN Y:", this.minY )
			// Distilled.log( "[Data] MAX Y:", this.maxY )
			// Distilled.log( "[Data] FULL HEIGHT:", this.fullHeight )


			// this.minY = (minMax.min * this.height) - offsetY;
			// this.maxY = (minMax.max * this.height) - offsetY;

			this.milestones = milestones;

			this.bounds = {
				x:0,
				y:0,
				width: (this.width * total) + offsetX + offsetX,
				height: minMax.max * this.height
			}
		},




		_minMax : function( $data )
		{
			var min = $data[0].value,
				max = $data[0].value,
				total = $data.length;

			for ( var i=0; i<total; i++ )
			{
				if ( min > $data[i].value )
					min = $data[i].value;

				if ( max < $data[i].value )
					max = $data[i].value;
			}

			return { min:min, max:max }
		}




	/******************************************/
	/*	Event Handlers
	/******************************************/

		// _onBtnClick : function( e, dir )
		// {
		// 	e.preventDefault();

		// 	this.trigger( "launch" );

		// 	return false;
		// },





	};

	// Assign the class to the Distilled object
	this.Distilled.Data = Data;

	// Return the class
	return Data;

}());


(function(){


	// Get the Distilled object or create it
	this.Distilled = this.Distilled || {};


	// Create the class
	var GameBus = function( settings, game, data )
	{
		this.mSettings = settings;
		this.mGame = game;
		this.mData = data;
		this.mFinishLine = data.finishLine;


		Phaser.Group.call( this, this.mGame, this.mGame.world, 'bus' );

		// Initalise the class
		this._init();

		this.mGame.add.existing( this );
	}


	GameBus.prototype = Object.create( Phaser.Group.prototype );
	GameBus.prototype.constructor = GameBus;

	// Add the properties to the class
	Object.assign( GameBus.prototype, {

	// GameBus.prototype = {


	/******************************************/
	/*	Public Vars
	/******************************************/


	/******************************************/
	/*	Private Vars
	/******************************************/

		mSettings: null,
		mGame: null,
		// mControls: null,
		mBody: null,
		mWheelBodies: null,
		mDriveJoints: null,

		mCanMove : null,

		mWheels: null,
		// mIsStuck: null,
		mStuckCounter: 0,
		mStartY: null,
		mSpeed: 50,
		mFinishLine: 0,
		mFinished: null,

		mMotorSpeed: 0,
		mMotorEnabled: false,

		mBusRotation: 0,
		mBusVelX: 0,

		mWheelContacts: 0,

		mDamaged: null,

		mHealth: 20,
		mTimerStarted: null,
		mTimerStart: 0,



	/******************************************/
	/*	Public Functions
	/******************************************/

		update: function()
		{
			this.mMotorSpeed = this.mSpeed;
			this.mMotorEnabled = true;
			// var motorSpeed = this.mSpeed; // rad/s
			// var motorEnabled = true;

			// if ( this.mControls.down.isDown ) { motorSpeed = 0; } // prioritize braking
			// else if ( this.mControls.left.isDown && !this.mControls.right.isDown ) { motorSpeed *= -1; }
			// else if ( this.mControls.right.isDown && !this.mControls.left.isDown ) {  }
			if ( this._canMove() )
			{
				this.mBody.body.angularDamping = 200;

				if ( this.mWheelContacts < 2 )
				{
					this.mBody.body.angularDamping = 0;
					this.mBody.body.angularVelocity += 0.01
				}
				else if ( this.mWheelContacts == 0 )
				{
					this.mBody.body.angularDamping = 0;
				}


				this.mEnginePitch = 0.05;

				if ( !this.mTimerStarted )
					this._startTimer();



			}
			// else { motorSpeed = 0; }
			// else { motorEnabled = false; } // roll if no keys pressed
			// if ( !this.mActive )
			else
			{
				this.mMotorSpeed = this.mDriveJoints[0].GetMotorSpeed();
				this.mMotorSpeed *= 0.9;
				this.mMotorEnabled = false;

				this.mBody.body.angularDamping = 0;

				this.mRevving = null;

				this.mEnginePitch = -0.1;

				// this.mAngularVelocity = 0;

				// this.mBody.body.angularVelocity *= 0.2;

				if ( this.mWheelContacts == 0 )
					this.mBody.body.angularVelocity += 0.03// * this.mSettings.scaler)

				if ( this.mWheelContacts < 2 )
					this.mBody.body.angularDamping = 0;
				else
					this.mBody.body.velocity.x *= 0.96;

				// this.mWheelAdjust = 0;
			}

			// Reduce the magnitude
			// this.mBody.body.velocity.setMagnitude( Math.min( MAX_SPEED, this.mBody.body.velocity.getMagnitude()));


			// Check to see if we have a milestone and if we have passed it
			if ( this.mNextMilestone && this.mBody.x > this.mNextMilestone.x )
			{
				// Play the milestone sfx
				this.mSFXMilestone.play( "", 0, this.mSettings.volume.milestone );

				if ( this.mNextMilestone.hasOwnProperty( "isReferendum" ))
				{
					// Trigger hitting the referendum
					$d.trigger( "event_referendum" );
				}

				// Clear the current milestone
				this.mNextMilestone = null;

				// Find the next milestone
				this._findNextMilestone();
			}


			if ( this.mSFXEngine._sound )
			{
				// Distilled.log( this.mSFXEngine );
				this.mSFXEngine._sound.playbackRate.value += this.mEnginePitch;

				if ( this.mSFXEngine._sound.playbackRate.value > 4 )
					this.mSFXEngine._sound.playbackRate.value = 3.5;

				if ( this.mSFXEngine._sound.playbackRate.value < 1 )
					this.mSFXEngine._sound.playbackRate.value = 1;
			}



			// Distilled.log( "[GameBus] UPDATING:", motorSpeed, this.mActive );

			if ( this.mBody.x > this.mFinishLine )
			{
				this.mMotorSpeed = 0;
				this.mMotorEnabled = false;

				// Bring the bus to a slow stop
				this.mBody.body.velocity.x *= 0.95;

				// If finished hasnt been set yet
				if ( !this.mFinished )
				{
					// FINISHED
					Distilled.log( "[GameBus] FINISHED!!" );

					// Disable the controls
					// this.mControls.disabled = true;

					// Call complete
					this._complete();
				}

				if ( this.mBody.body.velocity.x <= 0.1 )
				{
					this._stopped();
				}
			}

			for ( var i=0; i<3; i++ ) {
				this.mDriveJoints[i].SetMotorSpeed( this.mMotorSpeed );
				this.mDriveJoints[i].EnableMotor( this.mMotorEnabled );

				if ( this.mWheelBodies[i].body.angularVelocity > 60 )
					this.mWheelAdjust = 0.0174533*15; // 1 deg in rad
				else
					this.mWheelAdjust = 0;

				// Distilled.log( this.mWheelBodies[i].body.angularVelocity )

				this.mWheelBodies[i].body.rotation += this.mWheelAdjust;
			}



			// this.mWheelBodies[1].body.rotation += this.mWheelAdjust;
			// this.mWheelBodies[2].body.rotation += this.mWheelAdjust;



			// If we have finished then return
			if ( this.mFinished ) return;

			// Check to see if the bus is stuck
			this._isStuck();
		},



		getBody : function()
		{
			return this.mBody;
		},



		startY : function( val )
		{
			var startX = this.mData.startPos;

			this.setPosition( startX, val-150 );

			this.mStartY = val;
		},



		start : function()
		{
			this.mCanMove = null;
			this.mDamaged = null;
			this.mHealth = 10;
			this.mBody.frameName = "bus";
			this.mTimerStarted = null;
			this.mTimerStart = 0

			// Find the next milestone
			this._findNextMilestone();

			var self = this;
			setTimeout( function(){
				self.mSFXStart.play( "", 0, self.mSettings.volume.engineStart );
				self.mCanMove = true;
			}, 500 )

			setTimeout( function(){
				self.mSFXEngine.loopFull( self.mSettings.volume.engineLoop );
			}, 1500 )
		},



		stop : function()
		{
			// Set finished
			this.mFinished = true;

			// Stop the timer
			this._stopTimer();

			// Stop the movement
			this.mCanMove = null;

			// Stop the engine
			this.mSFXEngine.stop();

			// Stop the wheels
			for (var i=0; i<3; i++)
			{
				this.mDriveJoints[i].SetMotorSpeed( 0 );
				this.mDriveJoints[i].EnableMotor( false );
				this.mWheelBodies[i].body.angularVelocity = 0;
				// this.mWheelBodies[i].angularVelocity = 0;
			}
		},



		restart : function()
		{
			this.mCanMove = null;

			this.startY( this.mStartY );

			var self = this;
			setTimeout( function(){
				self.mFinished = null;

				// Disable the controls
				// self.mControls.disabled = false;

			}, 1000 );
		},



		reset : function()
		{
			var currentX = this.mBody.x;
			// var currentY = this.mBody.y;
			var newX = currentX  - 500;
			// var newY = currentY - 100;

			// Check to make sure the new X doesnt go out of bounds
			if ( newX < 100 ) newX = 100;

			// Get the new Y position
			var newY = this._getYPos( newX );

			// Set the position
			this.setPosition( newX, newY );

			// Find the next milestone
			this._findNextMilestone();
		},



		setPosition : function( x, y )
		{
			// Update the engine
			this.update( false, 0 );

			// Reset the velocity
			this.mBody.body.velocity.x = 0;
			this.mBody.body.velocity.y = 0;

			// Reset the rotation of the bus
			this.mBody.body.rotation = 0;

			// Reset the position of the body
			this.mBody.body.x = x;
			this.mBody.body.y = y;

			// Reset the graphics of the body
			this.mBody.x = x;
			this.mBody.y = y;

			// Reset the position of the wheels
			for ( var i=0; i<3; i++ ) {
				this.mWheelBodies[i].body.reset(
					x + this.mWheels[i].positionX,
					y + this.mWheels[i].positionY + 60
				)
			}

			for ( var i=0; i<3; i++ ) {
				this.mDriveJoints[i].EnableMotor( false );
				this.mDriveJoints[i].SetMotorSpeed( 0 );
			}
		},



		setupContactCallback : function( terrain )
		{
			// Distilled.log( "[GameBus] SETUP CONTACT CALLBACK:", terrain )

			for ( var i=0; i<this.mWheelBodies.length; i++ )
			{
				// Set a collision callback
				this.mWheelBodies[i].body.setBodyContactCallback( terrain, this._onWheelContact, this );
				this.mWheelBodies[i].body.setBodyPostsolveCallback( terrain, this._onWheelContactPost, this );
			}

			this.mBody.body.setBodyPostsolveCallback( terrain, this._onBodyContact, this );
		},




	/******************************************/
	/*	Private Functions
	/******************************************/

		_init : function()
		{

			this.mSpeed = this.mSettings.bus.speed;
			this.mWheels = this.mSettings.bus.wheels;
			this.mWheelBodies = [];
			this.mDriveJoints = [];

			this.inputEnableChildren = false;

			this._createBody();

			var total = this.mWheels.length,
				zoom = this.mSettings.zoom;

			for ( var i=0; i<total; i++ )
			{
				this.mWheels[i].rideHeight *= zoom;
				this.mWheels[i].positionX *= zoom;
				this.mWheels[i].positionY *= -zoom;

				this._createWheel( i, this.mWheels[i] )
				this._createJoint( i, this.mWheels[i] )
			}

			this._createSFX();
		},



		_createBody : function()
		{
			var busVertices = this.mSettings.bus.bodyVerticies;
			var total = busVertices.length;
			var zoom = this.mSettings.zoom;

			if ( this.mSettings.bus.scaleBodyVerticies == true )
			{
				for ( var i=0; i<total; i++ )
				{
					busVertices[i] *= zoom;
					busVertices[i] *= this.mSettings.scaler;
				}
			}
			else if ( this.mSettings.scaler < 1 )
			{
				for ( var i=0; i<total; i++ )
				{
					busVertices[i] *= this.mSettings.scaler;
				}
			}


			// Make the truck body
			this.mBody = new Phaser.Sprite( this.mGame, null, null, "assetsAtlas", "bus" );
			this.mBody.inputEnabled = false;
			this.mBody.scale.setTo( this.mSettings.scaler, this.mSettings.scaler );




			// Add the body to the group
			this.addChild( this.mBody );


			// Enable the physics on the body
			this.mGame.physics.box2d.enable( this.mBody, false );

			// this.mBody.body.clearFixtures();
			this.mBody.body.setPolygon( busVertices );

			// this.mBody.body.mass *= 2;

		},



		_createWheel : function( id, data )
		{
			// Create the wheel
			var wheel = new Phaser.Sprite( this.mGame, null, null, "assetsAtlas", "wheel" );

			// Set the wheel of the scale
			wheel.scale.setTo( this.mSettings.scaler, this.mSettings.scaler );

			var wheelSize = wheel.width * 0.5;
				wheelSize *= this.mSettings.scaler;

			// Enable the physics on the body
			this.mGame.physics.box2d.enable( wheel, false );

			// Create the physics circle
			wheel.body.setCircle( wheelSize );

			// Position the wheel
			wheel.body.x = this.mWheels[id].positionX //* this.mSettings.scaler;
			wheel.body.y = this.mWheels[id].positionY //* this.mSettings.scaler;

			// wheel.body.mass *= 2;

			// Disable input
			wheel.inputEnabled = false;

			// Add the wheel to the wheel bodies
			this.mWheelBodies[id] = wheel;

			// Add the wheel to the world
			// this.mGame.world.addChild( wheel );
			this.addChild( wheel );

			// if ( id==2 )
				// wheel.body.mass *= 2;
		},



		_createJoint : function( id, data )
		{
			var frequency 		= data.frequency //* this.mSettings.scaler;
			var damping 		= data.damping //* this.mSettings.scaler;
			var motorTorque	 	= data.motorTorque //* this.mSettings.scaler;
			var y 				= data.rideHeight //* this.mSettings.scaler;
			var x 				= data.positionX //* this.mSettings.scaler;

			var motorSpeed 		= 0;
			var motorEnabled 	= false;

			// bodyA, bodyB, ax, ay, bx, by, axisX, axisY, frequency, damping, motorSpeed, motorTorque, motorEnabled
			this.mDriveJoints[id] = this.mGame.physics.box2d.wheelJoint( this.mBody, this.mWheelBodies[id], x, y, 0, 0, 0, 1, frequency, damping, motorSpeed, motorTorque, motorEnabled );
		},



		_createSFX : function()
		{
			this.mSFXSuccess = this.mGame.add.audio('success');
			this.mSFXFailure = this.mGame.add.audio('failure');
			this.mSFXThuds = [ this.mGame.add.audio('thud1'), this.mGame.add.audio('thud2'), this.mGame.add.audio('thud3')];
			this.mSFXMilestone = this.mGame.add.audio('milestone');
			this.mSFXCrunch = this.mGame.add.audio('crunch');
			this.mSFXStart = this.mGame.add.audio( "start" );
			this.mSFXEngine = this.mGame.add.audio( "engine" );

		},




		_isStuck : function()
		{
			this.mBusRotation = Math.abs( this.mBody.body.rotation );
			this.mBusVelX = Math.abs( this.mBody.body.velocity.x );

			// if ( rotation > 6.28319 )
			// {
				while( this.mBusRotation > 6.28319 )
				{
					this.mBusRotation -= 6.28319;
				}
			// }

			// Check to see if the body is upside down
			// 25deg - 335deg
			if ( this.mBusRotation > 0.436332 && this.mBusRotation < 5.84685 && this.mBusVelX < 10 )
			{
				// Distilled.log( "[GameBus] STUCK!!:", this.mStuckCounter );

				// if ( !this.mIsStuck )
				// {
				// 	// var self = this;

				// 	this.mIsStuck = true;
				// 	// this.mResetTimeout = setTimeout( function(){
				// 	// 	self._dead();
				// 	// }, 1000 );
				// }

				this.mStuckCounter ++;

				if ( this.mStuckCounter >= 60 )
					this._dead();
			}
			else
			{
				// this.mIsStuck = null;
				this.mStuckCounter = 0;
				// clearTimeout( this.mResetTimeout );
				this.mResetTimeout = null;
			}
		},



		_getYPos : function( x )
		{
			var data = this.mData.verticies;
			// var width = data.width;
			var total = data.length;
			var start, end

			for ( var i=0; i<total; i+=2 )
			{
				start = data[i];
				end = data[i+2]

				if ( x >= start && x <= end )
					return data[i+1]-200;
			}

			return data[1]-200;
		},




		_getDistance : function()
		{
			var x = this.mBody.x;
			var days = 0;
			var data = this.mData.data;
			var total = data.length;
			var canCount = null;

			if ( x < this.mData.startPos )
				return 0;

			for ( var i=0; i<total; i++ )
			{
				if ( data[i].hasOwnProperty( "start" ))
					canCount = true;

				if ( canCount )
				{
					days ++;

					if ( x >= data[i].x && x < data[i+1].x )
						break;
				}

				if ( data[i].hasOwnProperty( "finish" ))
					canCount = null;
			}

			Distilled.log( "[GameBus] DAYS COVERED:", days );

			return days;
		},



		_complete : function()
		{
			// Stop the bus
			this.stop();

			// Trigger the compelte event
			$d.trigger( "event_complete", {
				days : this._getDistance(),
				time : this.mTimerTime,
				type : "complete",
				complete : true,
			});

			// Play the success audio
			this.mSFXSuccess.play( "", 0, this.mSettings.volume.success );
		},



		_stopped : function()
		{
			// Trigger the stopped event
			$d.trigger( "event_stopped" );
		},



		_dead : function()
		{
			// Stop the bus
			this.stop();

			// Trigger the dead event
			$d.trigger( "event_dead", {
				days : this._getDistance(),
				time : this.mTimerTime,
				type : "dead",
				complete: null,
			});

			// Play the failure audio
			this.mSFXFailure.play( "", 0, this.mSettings.volume.failure );
		},



		_canMove : function()
		{
			if ( !this.mCanMove ) return null;

			if ( $d.MOUSE_DOWN || $d.SPACE || $d.RIGHT_ARROW || $d.D )
				return true;

			return null;
		},



		_playThud : function( volume )
		{
			var i = Math.floor(Math.random() * this.mSFXThuds.length) //+ 1

			// Distilled.log( "[GameBus] PLAY THUD:", i );

			if ( $d.MUTED ) return;

			this.mSFXThuds[i].play( "", 0, this.mSettings.volume.thud*volume );
		},



		_findNextMilestone : function()
		{
			var currentX = this.mBody.x;
			var milestones = this.mData.milestones;
			var total = milestones.length;

			for ( var i=0; i<total; i++ )
			{
				if ( currentX < milestones[i].x )
				{
					this.mNextMilestone = milestones[i]
					return;
				}
			}
		},



		_startTimer : function()
		{
			this.mTimerStarted = true;
			this.mTimerStart = Date.now();

			document.getElementById('timer').innerText = "0:00.0"

      this.timerInterval = setInterval(() => {
        const millis = Date.now() - this.mTimerStart;

        const minutes = Math.floor(millis / 60000);
        const seconds = Math.floor(millis % 60000 / 100) / 10;

        document.getElementById('timer').innerText = minutes + ':' + (seconds < 10 ? '0' : '') + seconds.toFixed(1);
      }, 100)
		},



		_stopTimer : function()
		{
			var time = Date.now();
			this.mTimerTime = time - this.mTimerStart;

      clearInterval(this.timerInterval);

      const minutes = Math.floor(this.mTimerTime / 60000);
			const seconds = Math.floor(this.mTimerTime % 60000) / 1000;

			document.getElementById('timer').innerText = minutes + ':' + (seconds < 10 ? '0' : '') + seconds.toFixed(3);
		},




	/******************************************/
	/*	Event Handlers
	/******************************************/


		_onWheelContact : function( body1, body2, fixture1, fixture2, begin )
		{
			if ( begin ) 	this.mWheelContacts ++;
			else			this.mWheelContacts --;
		},



		_onWheelContactPost : function( body1, body2, fixture1, fixture2, begin, impulseInfo )
		{
			if ( begin && impulseInfo.normalImpulses[0] >= 8 )
				this._playThud( 0.5 );
		},



		_onBodyContact : function( body1, body2, fixture1, fixture2, begin, impulseInfo )
		{
			// If we are finished then return
			if ( this.mFinished ) return;

			// Distilled.log( "[GameBus] BODY CONTACT IMPULS:", impulseInfo.normalImpulses[0] );

			if ( begin )
			{
				if ( impulseInfo.normalImpulses[0] >= 8 )
					this._playThud( 1 );

				if ( impulseInfo.normalImpulses[0] < 10 )
					return;

				// Distilled.log( "[GameBus] BODY CONTACT IMPULS:", impulseInfo.normalImpulses[0] );

				this.mHealth --;

				// Distilled.log( "[GameBus] BODY CONTACT HEALTH:", this.mHealth );

				switch( this.mHealth )
				{
					case 10 :
						this.mBody.frameName = 'bus';
						break;

					case 8 :
						this.mBody.frameName = 'bus';
						break;

					case 6 :
						this.mBody.frameName = 'bus_crushed';
						this.mSFXCrunch.play( "", 0, this.mSettings.volume.crunch );
						break;

					case 4 :
						this.mBody.frameName = 'bus_crushed';
						break;

					case 2 :
						this.mBody.frameName = 'bus_crushed';
						break;

					case 0 :
						this.mBody.frameName = 'bus_crushed';
						break;
				}

				// if ( this.mHealth !== 6 )
				// 	this._playThud();

				if ( this.mHealth < -1 )
					this.mHealth = -1;
			}
		},



	});

	// Assign the class to the Distilled object
	this.Distilled.GameBus = GameBus;

	// Return the class
	return GameBus;

}());


(function(){


	// Get the Distilled object or create it
	this.Distilled = this.Distilled || {};


	// Create the class
	var GameTerrain = function( settings, game, data )
	{
		this.mSettings = settings;
		this.mGame = game;
		this.mData = data;


		Phaser.Graphics.call( this, this.mGame, 0, 0 );

		// Initalise the class
		this._init();

		// if ( settings.debug == false && settings.drawTerrain == true )
			this.mGame.add.existing( this );
	}



	GameTerrain.prototype = Object.create( Phaser.Graphics.prototype );
	GameTerrain.prototype.constructor = GameTerrain;

	// Add the properties to the class
	Object.assign( GameTerrain.prototype, {


	/******************************************/
	/*	Public Vars
	/******************************************/

		focusY: 0,
		startY: 0,


	/******************************************/
	/*	Private Vars
	/******************************************/

		mGame: null,
		mData : null,



	/******************************************/
	/*	Public Functions
	/******************************************/

		update : function()
		{
			this._dynamicDraw();
		},



		getPhysicsBody : function()
		{
			return this.mTerrainPhysics;
		},



		resize : function()
		{
			if ( this.mGame.paused == true )
				this._dynamicDraw();
		},




	/******************************************/
	/*	Private Functions
	/******************************************/

		_init : function()
		{
			var dataVerts = this.mData.verticies;

			// Make a copy of the verts
			var verticies = dataVerts.slice();//[ dataVerts[0], dataVerts[1]-200 ];

			// Get the total number of verts
			var total = dataVerts.length;

			// Add in verts at the start and end
			verticies.unshift( dataVerts[0], dataVerts[1]-200 );
			verticies.push( dataVerts[total-2], dataVerts[total-1]-200 );

			// verticies = this._smoothVerticies( verticies );

			this.mTerrainPhysics = new Phaser.Physics.Box2D.Body( this.mGame, null, 0, 0, 0 );
			this.mTerrainPhysics.setChain( verticies );
			this.mTerrainPhysics.static = true;

			this.fixedToCamera = true;
			this.inputEnabled = false;
			this.inputEnableChildren = false;

			this._dynamicDraw();

			this.startY = this.focusY;

			// Distilled.log( "[GameTerrain] Y FOCUS:", this.focusY )
		},



		// _smoothVerticies : function( verts )
		// {
		// 	var total = verts.length - 4;
		// 	var last,
		// 		current,
		// 		next,
		// 		d1,
		// 		d2,
		// 		d3;

		// 	for ( var i=2; i<total; i+=2 )
		// 	{
		// 		last = verts[i-1];
		// 		current = verts[i+1];
		// 		next = verts[i+3];

		// 		d1 = current - last;
		// 		d2 = next - current;
		// 		d3 = d2 - d1;

		// 		// if ( d3 > 30 )
		// 		// 	verts[i+1] + 15;
		// 		// else if ( d3 < -30 )
		// 		// 	verts[i+1] - 15;

		// 		if ( d1 > d2-200 && d1 < d2+200 )
		// 			verts[i+1] + 100;

		// 		Distilled.log( "[GameTerrain] D1:", d1, " D2:", d2, " D3:", d3 );

		// 	}

		// 	return verts;
		// },




		_dynamicDraw : function()
		{
			var verticies = this.mData.verticies,
				total = verticies.length,
				offsetX = this.mGame.camera.x,
				offsetY = this.mGame.camera.y,
				i = this._getStart( verticies, offsetX );
				// x,y;

			// Check to make sure i is not less than 0
			if ( i<0 )
			{
				// if it is then set X to 0 and i to 0
				this.mDrawX = 0;
				i = 0;
			}
			else
			{
				// Get the X val from verticies
				this.mDrawX = verticies[i] - offsetX;
			}

			// Get the starting y verticie
			this.mDrawY = verticies[i+1] - offsetY;

			// Calculate the bottom
			this.mBtm = this.mSettings.height + 100;

			// Clear the graphics
			this.clear();

			// Begin the fill and set the line style
			this.beginFill( 0x000000, 0.2 );
			this.lineStyle( 6, 0xffffff );

			// Move to the starting position
			this.moveTo( this.mDrawX-100, this.mBtm );

			// Draw the first line to the top
			this.lineTo( this.mDrawX-100, this.mDrawY );

			// Loop through all of the verticies drawing the lines in view
			for ( i; i<total; i+=2 )
			{
				// Get the X and Y
				this.mDrawX = verticies[i] - offsetX;
				this.mDrawY = verticies[i+1] - offsetY;

				// Draw the line
				this.lineTo( this.mDrawX, this.mDrawY );

				// Check to see if x is within the window width
				if ( this.mDrawX > this.mSettings.width )
				{
					this.mDrawX += 100
					this.lineTo( this.mDrawX, this.mDrawY );
					break;
				}
			}

			// this.focusY = this.mDrawY + offsetY;
			this.focusY = verticies[i-3];

			// Distilled.log( "[GameTerrain] FOCUS Y:", this.focusY, "-", i-3 );

			// this.mDrawX = this.mGame.width+100;
			this.mDrawX = this.mSettings.width + 100;

			this.lineTo( this.mDrawX, this.mDrawY );

			// Draw the line down to the bottom
			this.lineTo( this.mDrawX, this.mBtm );

			// End the fill
			this.endFill();
		},



		_getStart : function( verticies, offsetX )
		{
			var total = verticies.length,
				i=0;

			this.mI = 0;

			for ( this.mI; this.mI<total; this.mI+=2 )
			{
				if (( verticies[this.mI]-offsetX ) < 0 )
					continue;
				else
					return this.mI-2;
			}
		},











	/******************************************/
	/*	Event Handlers
	/******************************************/


	});

	// Assign the class to the Distilled object
	this.Distilled.GameTerrain = GameTerrain;

	// Return the class
	return GameTerrain;

}());


(function(){


	// Get the Distilled object or create it
	this.Distilled = this.Distilled || {};


	// Create the class
	var GameBackground = function( settings, game, data )
	{
		this.mSettings = settings;
		this.mGame = game;
		this.mData = data;


		Phaser.Sprite.call( this, this.mGame, 0, 0, "assetsAtlas", "bg_gradient" );

		// Initalise the class
		this._init();

		this.mGame.add.existing( this );
	}


	GameBackground.prototype = Object.create( Phaser.Sprite.prototype );
	GameBackground.prototype.constructor = GameBackground;



	// Add the properties to the class
	Object.assign( GameBackground.prototype, {


	/******************************************/
	/*	Public Vars
	/******************************************/




	/******************************************/
	/*	Private Vars
	/******************************************/

		mGame: null,



	/******************************************/
	/*	Public Functions
	/******************************************/

		update : function()
		{
			this.mScrollMultiplier  = this.mGame.camera.y;
			this.mScrollMultiplier += ( this.mSettings.height * 0.6 )
			// this.mScrollMultiplier += 100
			this.mScrollMultiplier -= this.mData.minY;
			this.mScrollMultiplier /= (this.mData.fullHeight - 150);

			// Distilled.log( "[GameBackground] POS:", pos )

			this.cameraOffset.y = 0 - (( this.height - this.mSettings.height) * this.mScrollMultiplier )


			if ( this.cameraOffset.y > 0 )
				this.cameraOffset.y = 0;

			if ( this.cameraOffset.y < 0-(this.height -this.mSettings.height))
				this.cameraOffset.y = 0-(this.height -this.mSettings.height)
		},



		resize : function()
		{
			this.width = this.mSettings.width + 200;
			this.height = this.mSettings.height * 2;

			// this.mScreenCenterY = this.mGame.height * 0.5;
			// this.mScrollMultiplier = (this.mData.min / this.mData.max) - 0.02;

			// this._calculateScroll();
		},



	/******************************************/
	/*	Private Functions
	/******************************************/

		_init : function()
		{
			this.fixedToCamera = true;
			this.inputEnabled = false;
			this.inputEnableChildren = false;
			this.smoothed = false;

			this.resize();
		},



		_calculateScroll : function()
		{
			// var bgHeight = this.height;
			// var gameHeight = window.innerHeight;
			// var maxHeight = (this.mData.maxY - this.mData.minY) + (gameHeight*0.5);

			// this.mScreenCenterY = gameHeight * 0.5;
			// this.mScrollMultiplier = (bgHeight - gameHeight) / maxHeight;

			// Distilled.log( "[GameBackground] DATA:", this.mData.maxY, "-", this.mData.minY );
			// Distilled.log( "[GameBackground] HEIGHT:", bgHeight );
			// Distilled.log( "[GameBackground] WINDOW HEIGHT:", gameHeight );
			// Distilled.log( "[GameBackground] CAMERA MULTIPLIER:", this.mScrollMultiplier );
		},



	/******************************************/
	/*	Event Handlers
	/******************************************/


	});

	// Assign the class to the Distilled object
	this.Distilled.GameBackground = GameBackground;

	// Return the class
	return GameBackground;

}());


(function(){


	// Get the Distilled object or create it
	this.Distilled = this.Distilled || {};


	// Create the class
	var GameUIVertical = function( settings, game, data )
	{
		this.mSettings = settings;
		this.mGame = game;
		this.mData = data;

		Phaser.Group.call( this, this.mGame, this.mGame.world, "ui_vertical" );

		// Initalise the class
		this._init();

		this.mGame.add.existing( this );
	}


	GameUIVertical.prototype = Object.create( Phaser.Group.prototype );
	GameUIVertical.prototype.constructor = GameUIVertical;



	// Add the properties to the class
	Object.assign( GameUIVertical.prototype, {


	/******************************************/
	/*	Public Vars
	/******************************************/


	/******************************************/
	/*	Private Vars
	/******************************************/

		mGame: null,
		mData: null,

		mGridLines: null,



	/******************************************/
	/*	Public Functions
	/******************************************/

		update : function()
		{
			// this.cameraOffset.y = 0 - this.mGame.camera.y;
			this.cameraOffset.y = (0 - this.mGame.camera.y) | 0;
		},



		resize : function()
		{
			var lines = this.mGridLines;
			var total = lines.length;

			for ( var i=0; i<total; i++ )
			{
				// this.mGridLines[i].width = this.mGame.width;
				this.mGridLines[i].width = this.mSettings.width;
			}
		},



	/******************************************/
	/*	Private Functions
	/******************************************/

		_init : function()
		{
			this.fixedToCamera = true;
			this.inputEnabled = false;
			this.inputEnableChildren = false;

			this.mGridLines = [];

			// var data = this.mData.data;
			var min = parseFloat( this.mData.min.toFixed(1)) - 0.3;
			var max = parseFloat( this.mData.max.toFixed(1)) + 0.05; //+ 0.1;// + 0.3;
			var values = [];
			var value = min;

			while( value <= max )
			{
				values.push( parseFloat( value.toFixed( 2 )));
				value += 0.05;
			}

			var total = values.length;

			for ( var i=0; i<total; i++ )
			{
				this._createUI( values[i] );
				this._createGridLine( values[i] )
			}



			this._createLabel( max );
		},



		_createUI : function( value )
		{
			// var y = ( value * this.mData.height ); //+ this.mData.offsetY;


			// Get the data value
			var y = value;

			// Reduce the value by the min this should then make the min value 0
			y -= this.mData.min;


			if ( this.mSettings.data.flipAxis == true )
			{
				var flippedY = ( this.mData.max - this.mData.min )

				// Flip the y so the biggest is the smallest
				y = flippedY - y;
			}


			// Multiply the value by the height
			y *= this.mData.height;

			// Add on the Y offset
			y += this.mData.offsetY

			y = y|0;


			var text = value.toFixed(2);
			var bitmapText = new Phaser.BitmapText( this.mGame, 20, y, 'helvetica', text, this.mSettings.uiFontSize );

			// Distilled.log( "[GameUIVertical] BM TEXT:", bitmapText );
			bitmapText.y -= ((bitmapText.height*0.5) | 0)+4;
			bitmapText.autoCull = this.mSettings.autoCull;


			this.addChild( bitmapText );
		},




		_createGridLine : function( value )
		{
			// Get the data value
			var y = value;

			// Reduce the value by the min this should then make the min value 0
			y -= this.mData.min;


			if ( this.mSettings.data.flipAxis == true )
			{
				var flippedY = ( this.mData.max - this.mData.min )

				// Flip the y so the biggest is the smallest
				y = flippedY - y;
			}


			// Multiply the value by the height
			y *= this.mData.height;

			// Add on the Y offset
			y += this.mData.offsetY

			y = y|0;



			var line = new Phaser.Image( this.mGame, 0, y, "assetsAtlas", "white_25" );

			line.width = this.mSettings.width;
			line.height = 1;
			line.autoCull = this.mSettings.autoCull;

			this.addChildAt( line, 0 );

			this.mGridLines.push( line );
		},



		_createLabel : function( value )
		{
			// Get the data value
			var y = value - 0.01;

			// Reduce the value by the min this should then make the min value 0
			y -= this.mData.min;


			if ( this.mSettings.data.flipAxis == true )
			{
				var flippedY = ( this.mData.max - this.mData.min )

				// Flip the y so the biggest is the smallest
				y = flippedY - y;
			}


			// Multiply the value by the height
			y *= this.mData.height;

			// Add on the Y offset
			y += this.mData.offsetY

			y = y|0;


			var text = "GBP to EUR";
			var bitmapText = new Phaser.BitmapText( this.mGame, 14, y, 'helvetica', text, this.mSettings.uiFontSize );

			// Distilled.log( "[GameUIVertical] BM TEXT:", bitmapText );
			bitmapText.y -= ((bitmapText.height*0.5) | 0)+4;
			bitmapText.rotation = this.mGame.math.degToRad( -90 );
			bitmapText.autoCull = this.mSettings.autoCull;


			this.addChild( bitmapText );
		},



	/******************************************/
	/*	Event Handlers
	/******************************************/


	});

	// Assign the class to the Distilled object
	this.Distilled.GameUIVertical = GameUIVertical;

	// Return the class
	return GameUIVertical;

}());


(function(){


	// Get the Distilled object or create it
	this.Distilled = this.Distilled || {};


	// Create the class
	var GameUIHorizontal = function( settings, game, data )
	{
		this.mSettings = settings;
		this.mGame = game;
		this.mData = data;

		Phaser.Group.call( this, this.mGame, this.mGame.world, "ui_horizontal" );

		// Initalise the class
		this._init();

		this.mGame.add.existing( this );
	}


	GameUIHorizontal.prototype = Object.create( Phaser.Group.prototype );
	GameUIHorizontal.prototype.constructor = GameUIHorizontal;



	// Add the properties to the class
	Object.assign( GameUIHorizontal.prototype, {


	/******************************************/
	/*	Public Vars
	/******************************************/


	/******************************************/
	/*	Private Vars
	/******************************************/

		mGame: null,
		mData: null,

		mGridLines: null,



	/******************************************/
	/*	Public Functions
	/******************************************/

		update : function()
		{
			// this.cameraOffset.x = 0 - this.mGame.camera.x;
			this.cameraOffset.x = (0 - this.mGame.camera.x) | 0;
		},



		resize : function()
		{
			var lines = this.mGridLines;
			var total = lines.length;

			for ( var i=0; i<total; i++ )
			{
				// this.mGridLines[i].height = this.mGame.height;
				this.mGridLines[i].height = this.mSettings.height;
			}

			var text = this.mText;
			var total = text.length;

			for ( var i=0; i<total; i++ )
			{
				// this.mGridLines[i].height = this.mGame.height;
				this.mText[i].y = this.mSettings.height - 40;
			}
		},



	/******************************************/
	/*	Private Functions
	/******************************************/

		_init : function()
		{
			this.fixedToCamera = true;
			this.inputEnabled = false;
			this.inputEnableChildren = false;

			this.mGridLines = [];
			this.mText = [];

			var data = this.mData.data;
			var total = data.length;
			var width = this.mData.width;
			// var x = 0;

			for ( var i=0; i<total; i++ )
			{
				// x += width;

				if ( data[i].day == 1 || i == 0 )
				{
					this._createUI( data[i].month, data[i].year, data[i].x );
					this._createGridLine( data[i].x )
				}

				if ( data[i].day == 16 )
					this._createGridLine( data[i].x )
			}
		},



		_createUI : function( month, year, x )
		{
			var text = this._getMonth( month ) + " '"+ year.substring( 2 );
			var bitmapText = new Phaser.BitmapText( this.mGame, x, this.mSettings.height - 40, 'helvetica', text, this.mSettings.uiFontSize );

			bitmapText.align = "center";
			// bitmapText.anchor.set( bitmapText.centerX, 0 )
			bitmapText.x -= bitmapText.width*0.5;
			bitmapText.autoCull = this.mSettings.autoCull;

			// Distilled.log( "[GameUIHorizontal] BM TEXT:", bitmapText );

			this.addChild( bitmapText );

			this.mText.push( bitmapText );
		},



		_getMonth : function( value )
		{
			switch( value )
			{
				case 1 : 	case "1" : 		case "01" : 		return "Jan";			break;
				case 2 : 	case "2" : 		case "02" : 		return "Feb";			break;
				case 3 : 	case "3" : 		case "03" : 		return "Mar";			break;
				case 4 : 	case "4" : 		case "04" : 		return "Apr";			break;
				case 5 : 	case "5" : 		case "05" : 		return "May";			break;
				case 6 : 	case "6" : 		case "06" : 		return "Jun";			break;
				case 7 : 	case "7" : 		case "07" : 		return "Jul";			break;
				case 8 : 	case "8" : 		case "08" : 		return "Aug";			break;
				case 9 : 	case "9" : 		case "09" : 		return "Sep";			break;
				case 10 : 	case "10" : 	case "10" : 		return "Oct";			break;
				case 11 : 	case "11" : 	case "11" : 		return "Nov";			break;
				case 12 : 	case "12" : 	case "12" : 		return "Dec";			break;
			}
		},



		_createGridLine : function( x )
		{
			var line = new Phaser.Image( this.mGame, x, 0, "assetsAtlas", "white_25" );

			line.width = 1;
			line.height = this.mSettings.height;
			line.autoCull = this.mSettings.autoCull;

			this.addChildAt( line, 0 );

			this.mGridLines.push( line );
		},



	/******************************************/
	/*	Event Handlers
	/******************************************/


	});

	// Assign the class to the Distilled object
	this.Distilled.GameUIHorizontal = GameUIHorizontal;

	// Return the class
	return GameUIHorizontal;

}());


(function(){


	// Get the Distilled object or create it
	this.Distilled = this.Distilled || {};


	// Create the class
	var GameUIProgress = function( settings, game, data )
	{
		this.mSettings = settings;
		this.mGame = game;
		this.mData = data;

		Phaser.Group.call( this, this.mGame, this.mGame.world, "ui_progress" );

		// Initalise the class
		this._init();

		this.mGame.add.existing( this );
	}


	GameUIProgress.prototype = Object.create( Phaser.Group.prototype );
	GameUIProgress.prototype.constructor = GameUIProgress;



	// Add the properties to the class
	Object.assign( GameUIProgress.prototype, {


	// GameUIProgress.prototype = Object.create( Distilled.Events.prototype );
	// GameUIProgress.prototype.constructor = GameUIProgress;



	// // Add the properties to the class
	// Object.assign( GameUIProgress.prototype, {


	/******************************************/
	/*	Public Vars
	/******************************************/


	/******************************************/
	/*	Private Vars
	/******************************************/

		mGame: null,
		mData: null,

		// mOutline: null,
		mBar: null,
		mText: null,
		// mText: null,



	/******************************************/
	/*	Public Functions
	/******************************************/

		// update : function()
		// {
		// 	// this.cameraOffset.x = 0 - this.mGame.camera.x;
		// 	// this.cameraOffset.x = (0 - this.mGame.camera.x) | 0;


		// 	this.mBar.scale.x =
		// },



		resize : function()
		{

		},


		setProgress : function( progress )
		{
			if ( progress < 0 ) progress = 0;
			if ( progress > 1 ) progress = 1;

			// Distilled.log( "[GameUIProgress] PROGRESS:", progress );

			// this.cssTransform = "scale( "+progress+", 1 )";

			// this.mBar.style.cssText = "-webkit-transform: "+ this.cssTransform +";"+
			// 						  "-moz-transform: "+ this.cssTransform +";"+
			// 						  "-ms-transform: "+ this.cssTransform +";"+
			// 						  "-o-transform: "+ this.cssTransform +";"+
			// 						  "transform: "+ this.cssTransform +";";

			// this.mPercentage.innerHTML = parseInt(progress*100)+"%";

			this.mBar.scale.x = ( this.mBarMaxScale * progress );

			this.mText.text = ""+ parseInt( progress * 100 ) + "%";
		},





	/******************************************/
	/*	Private Functions
	/******************************************/

		_init : function()
		{
			var x = 20 * this.mSettings.deviceScale;
			var y = 35 * this.mSettings.deviceScale;
			var w = 150 * this.mSettings.deviceScale;
			var h = 16 * this.mSettings.deviceScale;
			var size = 2 * this.mSettings.deviceScale;

			if ( window.innerWidth < 768 )
			{
				x = 10 * this.mSettings.deviceScale;
				y = 18 * this.mSettings.deviceScale;
			}



			var left = new Phaser.Image( this.mGame, x, y, "assetsAtlas", "black" );
				left.width = size;
				left.height = h + size;
				left.smoothed = false;

			var top = new Phaser.Image( this.mGame, x, y, "assetsAtlas", "black" );
				top.width = w// + size;
				top.height = size;
				top.smoothed = false;

			var right = new Phaser.Image( this.mGame, x+w, y, "assetsAtlas", "black" );
				right.width = size;
				right.height = h+size;
				right.smoothed = false;

			var bottom = new Phaser.Image( this.mGame, x, y+h, "assetsAtlas", "black" );
				bottom.width = w;
				bottom.height = size;
				bottom.smoothed = false;

			var background = new Phaser.Image( this.mGame, x, y, "assetsAtlas", "white" );
				background.width = w;
				background.height = h
				background.smoothed = false;


			this.mBar = new Phaser.Image( this.mGame, x+(1 * this.mSettings.deviceScale), y+(1 * this.mSettings.deviceScale), "assetsAtlas", "black" );
			this.mBar.width = w;
			this.mBar.height = h;
			this.mBar.smoothed = false;


			this.mText = new Phaser.BitmapText( this.mGame, x, y, 'helvetica_b', "0%", this.mSettings.uiFontSize );
			this.mText.smoothed = true;

			this.mText.x += w + ( 14 * this.mSettings.deviceScale );
			// this.mText.y += 2;
			// this.mText.y -= ( 3 * this.mSettings.deviceScale )




			this.mBarWidth = w;
			this.mBarMaxScale = this.mBar.scale.x;

			this.mBar.scale.x = 0;

			// Distilled.log( this.mBarMaxScale )


			this.addChild( background );
			this.addChild( this.mBar );
			this.addChild( left );
			this.addChild( top );
			this.addChild( right );
			this.addChild( bottom );
			this.addChild( this.mText );


			this.mText.y -= (( this.mText.height - this.mBar.height ) * 0.5) + 3;

			// this.mBar = document.getElementById( "progress_bar" );
			// this.mPercentage = document.getElementById( "progress_percentage" )

			// Distilled.log( this.mBar )


			this.fixedToCamera = true;
			this.inputEnabled = false;
			this.inputEnableChildren = false;
		},



	/******************************************/
	/*	Event Handlers
	/******************************************/


	});

	// Assign the class to the Distilled object
	this.Distilled.GameUIProgress = GameUIProgress;

	// Return the class
	return GameUIProgress;

}());


(function(){


	// Get the Distilled object or create it
	this.Distilled = this.Distilled || {};


	// Create the class
	var GameCity = function( settings, game, data )
	{
		this.mSettings = settings;
		this.mGame = game;
		this.mData = data;

		Phaser.Group.call( this, this.mGame, this.mGame.world, 'bus' );

		// Initalise the class
		this._init();

		this.mGame.add.existing( this );
	}


	GameCity.prototype = Object.create( Phaser.Group.prototype );
	GameCity.prototype.constructor = GameCity;

	// Add the properties to the class
	Object.assign( GameCity.prototype, {

	// GameCity.prototype = {


	/******************************************/
	/*	Public Vars
	/******************************************/


	/******************************************/
	/*	Private Vars
	/******************************************/

		mGame: null,
		mData: null,
		mScreenCenterX: 0,
		mScrollMultiplier: 0.1,



	/******************************************/
	/*	Public Functions
	/******************************************/

		update : function()
		{
			// this.cameraOffset.x = Math.floor( 0 - (( this.mGame.camera.x + this.mScreenCenterX ) * this.mScrollMultiplier ));
			this.cameraOffset.x = ( 0 - (( this.mGame.camera.x + this.mScreenCenterX ) * this.mScrollMultiplier )) | 0;
		},



		resize : function()
		{
			// this.height = this.mGame.height;
			// this.scale.x = this.scale.y;
			// this.width = Math.floor(this.width+1);

			// this.mScreenCenterX = this.mGame.width * 0.5;
			// this.mScrollMultiplier = (this.width - this.mGame.width) / this.mData.bounds.width;


			this._scale();
			this._calculateScroll();
		},



		// show : function()
		// {
		// 	this.mGame.add.tween( this.cameraOffset ).to({ y:0 }, 3000, Phaser.Easing.Sinusoidal.InOut, true );
		// },



	/******************************************/
	/*	Private Functions
	/******************************************/

		_init : function()
		{
			// var image,
			// 	frame,
			// 	total = 15,
			// 	x = 0;

			// for ( var i=0; i<total; i++ )
			// {
			// 	frame = "city_frame_"+(i+1);
			// 	image = new Phaser.Image( this.mGame, x, 0, "assetsAtlas", frame );

			// 	// image.height = this.mGame.height;
			// 	// image.scaleX = image.scaleY;

			// 	image.autoCull = this.mSettings.autoCull;

			// 	// Distilled.log( "[GameCity] CITY SCALE X:", image.scaleX );
			// 	// Distilled.log( "[GameCity] CITY SCALE X:", image.scaleY );

			// 	this.addChild( image );

			// 	x += image.width|0;
			// 	x -= 1;
			// }


			this._addImage( "city_frame_01", 0, 0 );
			this._addImage( "city_frame_02", 501, 0 );
			this._addImage( "city_frame_03", 681, 0 );
			this._addImage( "city_frame_04", 1098, 0 );
			this._addImage( "city_frame_05", 1542, 0 );
			this._addImage( "city_frame_06", 1815, 0 );
			this._addImage( "city_frame_07", 2169, 0 );
			this._addImage( "city_frame_08", 2730, 0 );
			this._addImage( "city_frame_09", 2888, 0 );
			this._addImage( "city_frame_10", 3077, 0 );
			this._addImage( "city_frame_11", 3251, 0 );
			this._addImage( "city_frame_12", 3410, 0 );
			this._addImage( "city_frame_13", 3899, 0 );
			this._addImage( "city_frame_14", 4238, 0 );
			this._addImage( "city_frame_15", 4682, 0 );
			this._addImage( "city_frame_16", 5252, 0 );
			this._addImage( "city_frame_22", 5564, 713 );
			this._addImage( "city_frame_32", 1273, 814 );
			this._addImage( "city_frame_33", 2169, 814 );

			this._addImage( "city_frame_orange", 0, 545, 501, 455 );
			this._addImage( "city_frame_orange", 501, 520, 180, 480 );
			this._addImage( "city_frame_orange", 681, 520, 417, 480 );
			this._addImage( "city_frame_orange", 1098, 814, 175, 186 );
			this._addImage( "city_frame_orange", 2169, 737, 228, 77 );
			this._addImage( "city_frame_orange", 2397, 737, 333, 263 );
			this._addImage( "city_frame_orange", 2730, 773, 158, 227 );
			this._addImage( "city_frame_orange", 2888, 773, 189, 227 );
			this._addImage( "city_frame_orange", 3077, 773, 174, 227 );
			this._addImage( "city_frame_orange", 3251, 753, 159, 247 );
			this._addImage( "city_frame_orange", 3410, 824, 489, 176 );
			this._addImage( "city_frame_orange", 3899, 824, 339, 176 );
			this._addImage( "city_frame_orange", 4238, 713, 444, 287 );
			this._addImage( "city_frame_orange", 4682, 796, 570, 204 );
			this._addImage( "city_frame_orange", 5252, 713, 312, 287 );

			this._addImage( "city_frame_blue", 1542, 721, 273, 279 );
			this._addImage( "city_frame_blue", 1815, 824, 354, 176 );


			this._addImage( "stars", 577, 40, 240 );
			this._addImage( "star", 1759, 193, 34, 34 );


			this.fixedToCamera = true;
			this.inputEnabled = false;
			this.inputEnableChildren = false;

			// this.cameraOffset.y = this.mGame.height;


			// Distilled.log( "[GameCity] CITY SCALE:", this.scale );




			// Distilled.log( "[GameCity] CITY WIDTH:", bgWidth );
			// Distilled.log( "[GameCity] MAX WIDTH:", maxWidth );
			// Distilled.log( "[GameCity] GAME WIDTH:", gameWidth );

			this._scale();
			this._calculateScroll();
		},



		_scale : function()
		{
			this.height = this.mSettings.height;
			this.scale.x = this.scale.y;
			this.width = Math.floor(this.width+1);
		},



		_calculateScroll: function()
		{
			var bgWidth = this.width;
			var maxWidth = this.mData.bounds.width;
			var gameWidth = this.mSettings.width;

			this.mScreenCenterX = gameWidth * 0.5;
			this.mScrollMultiplier = (bgWidth - gameWidth) / maxWidth;
		},



		_addImage : function( frame, x, y, w, h )
		{
			var image = new Phaser.Image( this.mGame, x, y, "assetsAtlas", frame );

			if ( w ) image.width = w;
			if ( h ) image.height = h;

			if ( w && !h )
				image.scale.y = image.scale.x

			if ( !w && h )
				image.scale.x = image.scale.y

			image.autoCull = this.mSettings.autoCull;
			image.smoothed = false;
			// Distilled.log( image.texture );
			// image.tint = 0xFF00FF;

			this.addChild( image );
		}



	/******************************************/
	/*	Event Handlers
	/******************************************/


	});

	// Assign the class to the Distilled object
	this.Distilled.GameCity = GameCity;

	// Return the class
	return GameCity;

}());


(function(){


	// Get the Distilled object or create it
	this.Distilled = this.Distilled || {};


	// Create the class
	var GameClouds = function( settings, game, data )
	{
		this.mSettings = settings;
		this.mGame = game;
		this.mData = data;

		Phaser.Group.call( this, this.mGame, this.mGame.world, 'clouds' );

		// Initalise the class
		this._init();

		this.mGame.add.existing( this );
	}


	GameClouds.prototype = Object.create( Phaser.Group.prototype );
	GameClouds.prototype.constructor = GameClouds;

	// Add the properties to the class
	Object.assign( GameClouds.prototype, {

	// GameClouds.prototype = {


	/******************************************/
	/*	Public Vars
	/******************************************/


	/******************************************/
	/*	Private Vars
	/******************************************/

		mGame: null,
		mScreenCenterX: null,
		mScrollMultiplier: null,



	/******************************************/
	/*	Public Functions
	/******************************************/

		update : function()
		{
			// this.cameraOffset.x = 0 - (( this.mGame.camera.x + this.mScreenCenterX ) * this.mScrollMultiplier );
			this.cameraOffset.x = ( 0 - (( this.mGame.camera.x + this.mScreenCenterX ) * this.mScrollMultiplier )) | 0;
		},



		resize : function()
		{
			// this.mScreenCenterX = this.mGame.width * 0.5;
			// this.mScrollMultiplier = 0.1;

			var width = 4000;
			var scale = this.mSettings.height / 1000;
			var scaledWidth = width * scale;

			this.scale.set( scale, scale );

			this.mScreenCenterX = this.mSettings.width * 0.5;
			this.mScrollMultiplier = (scaledWidth - this.mSettings.width) / this.mData.bounds.width;

			// Distilled.log( "[GameClouds] SCALE:", scale );
		},



	/******************************************/
	/*	Private Functions
	/******************************************/

		_init : function()
		{
			this.inputEnabled = false;
			this.inputEnableChildren = false;
			this.fixedToCamera = true;
			this.inputEnabled = false;
			this.inputEnableChildren = false;


			// this._createCloud( "cloud_4", 60, 52 );
			// this._createCloud( "cloud_3", 484, 200 );
			// this._createCloud( "cloud_1", 793, 167 );
			// this._createCloud( "cloud_2", 998, 51 );
			// this._createCloud( "cloud_4", 1226, 268 );
			// this._createCloud( "cloud_3", 1321, 96 );
			// this._createCloud( "cloud_1", 1610, 139 );
			// this._createCloud( "cloud_3", 1815, 244 );
			// this._createCloud( "cloud_4", 2016, 76 );
			// this._createCloud( "cloud_2", 2249, 199 );
			// this._createCloud( "cloud_1", 2497, 303 );
			// this._createCloud( "cloud_4", 2730, 111 );
			// this._createCloud( "cloud_3", 2981, 328 );
			// this._createCloud( "cloud_1", 3270, 215 );
			// this._createCloud( "cloud_2", 3495, 79 );
			// this._createCloud( "cloud_4", 3723, 346 );
			// this._createCloud( "cloud_3", 3818, 124 );
			// this._createCloud( "cloud_1", 4107, 207 );
			// this._createCloud( "cloud_3", 4312, 302 );

			// this._createCloud( "cloud_4", 4513, 104 );
			// this._createCloud( "cloud_2", 4746, 227 );
			// this._createCloud( "cloud_1", 4994, 331 );
			// this._createCloud( "cloud_4", 5227, 139 );


			this._createCloud( "cloud_1", 108, 23 );
			this._createCloud( "cloud_2", 414, 155 );
			this._createCloud( "cloud_3", 654, 111 );
			this._createCloud( "cloud_4", 778., 43 );
			this._createCloud( "cloud_5", 1006, 109 );
			this._createCloud( "cloud_6", 837, 249 );
			this._createCloud( "cloud_7", 1354, 94 );
			this._createCloud( "cloud_9", 1643, 181 );
			this._createCloud( "cloud_9", 2001, 119 );
			this._createCloud( "cloud_9", 2196, 218 );
			this._createCloud( "cloud_12", 2700, 162 );
			this._createCloud( "cloud_13", 3088, 262 );
			this._createCloud( "cloud_14", 3489, 83 );
			this._createCloud( "cloud_15", 3697, 201 );

			// this._createCloud( "cloud_", ,  );
			// this._createCloud( "cloud_", ,  );
			// this._createCloud( "cloud_", ,  );


			this.resize();
		},



		_createCloud : function( frame, x, y )
		{
			var image = new Phaser.Image( this.mGame, x, y, "assetsAtlas", frame );

			image.autoCull = this.mSettings.autoCull;
			image.smoothed = false;
			// image.scale.set( 0.5, 0.5 );

			this.addChild( image );
		},



	/******************************************/
	/*	Event Handlers
	/******************************************/


	});

	// Assign the class to the Distilled object
	this.Distilled.GameClouds = GameClouds;

	// Return the class
	return GameClouds;

}());


(function(){


	// Get the Distilled object or create it
	this.Distilled = this.Distilled || {};


	// Create the class
	var GameEvent = function( game, data, settings )
	{
		this.mGame = game;
		this.mData = data;
		this.mSettings = settings;

		Phaser.Group.call( this, this.mGame, this.mGame.world, 'event_'+data.id );

		// Initalise the class
		this._init();

		// this.mGame.add.existing( this );
	}


	GameEvent.prototype = Object.create( Phaser.Group.prototype );
	GameEvent.prototype.constructor = GameEvent;

	// Add the properties to the class
	Object.assign( GameEvent.prototype, {

	// GameEvent.prototype = {


	/******************************************/
	/*	Public Vars
	/******************************************/


	/******************************************/
	/*	Private Vars
	/******************************************/

		mGame: null,
		mIcon: null,
		mLine: null,
		mYPos: 0,



	/******************************************/
	/*	Public Functions
	/******************************************/

		update : function()
		{
			this.mIconYPos = ( this.mYPos - this.mGame.camera.y - this.y )|0;

			this.mIcon.y = this.mIconYPos;

			this.mLine.cropRect.height = (this.mIconYPos - (this.mIcon.height * 0.5)) | 0;
			this.mLine.updateCrop();
		},



	/******************************************/
	/*	Private Functions
	/******************************************/

		_init : function()
		{
			if ( window.innerWidth < 768 )
				this.mYOffset = 60;

			var yOffset = this.mYOffset;

			// Get the text
			var text = this.mData.event.description;

			// Create the text object
			var descriptionText = new Phaser.BitmapText( this.mGame, 20.5, 10.5, 'helvetica', text, this.mSettings.uiFontSize );
				descriptionText.smoothing = true;

			// Create the text background
			var descriptionBG = new Phaser.Image( this.mGame, 0, 0, "assetsAtlas", "black" );
				descriptionBG.width = descriptionText.width + 40;
				descriptionBG.height = descriptionText.height + 26;

			// Create the line
			var line = new Phaser.Image( this.mGame, 0, 10, "assetsAtlas", "dashed_line" );

			// Crop the line
			line.crop( new Phaser.Rectangle( 0, 0, 2, 200 ));

			// Get the image name for the icon
			var image = this.mData.event.image;

			// Create the icon
			var icon = new Phaser.Image( this.mGame, 0, 200, "assetsAtlas", image );
				icon.scale.setTo( 0.5, 0.5 );
				icon.anchor.setTo( 0.5 , 1 );

			// Add the elements to the event
			this.addChild( line );
			this.addChild( descriptionBG );
			this.addChild( descriptionText );
			this.addChild( icon );

			// Set the scope variables
			this.mIcon = icon;
			this.mLine = line;
			this.mYPos = (this.mData.y)|0;
			this.inputEnabled = false;
			this.inputEnableChildren = false;
		},





	/******************************************/
	/*	Event Handlers
	/******************************************/


	});

	// Assign the class to the Distilled object
	this.Distilled.GameEvent = GameEvent;

	// Return the class
	return GameEvent;

}());


(function(){


	// Get the Distilled object or create it
	this.Distilled = this.Distilled || {};


	// Create the class
	var GameEvents = function( settings, game, data )
	{
		this.mSettings = settings;
		this.mGame = game;
		this.mData = data;

		Phaser.Group.call( this, this.mGame, this.mGame.world, 'events' );

		// Initalise the class
		this._init();

		this.mGame.add.existing( this );
	}


	GameEvents.prototype = Object.create( Phaser.Group.prototype );
	GameEvents.prototype.constructor = GameEvents;

	// Add the properties to the class
	Object.assign( GameEvents.prototype, {

	// GameEvents.prototype = {


	/******************************************/
	/*	Public Vars
	/******************************************/


	/******************************************/
	/*	Private Vars
	/******************************************/

		mGame: null,



	/******************************************/
	/*	Public Functions
	/******************************************/

		update : function()
		{
			// this.cameraOffset.x = 0 - this.mGame.camera.x;
			this.cameraOffset.x = (0 - this.mGame.camera.x)|0;

			// Distilled.log( this.cameraOffset.x )

			Phaser.Group.prototype.update.call( this );
		},



	/******************************************/
	/*	Private Functions
	/******************************************/

		_init : function()
		{
			this.fixedToCamera = true;
			this.inputEnabled = false;
			this.inputEnableChildren = false;

			this.mEvents = [];

			// Distilled.log( "[GameEvents] DATA:", this.mData );

			var data = this.mData.data,
				total = data.length,
				width = this.mData.width,
				y = 80 * this.mSettings.deviceScale,
				x = 0,
				event;

			if ( window.innerWidth < 768 )
				y = 60 * this.mSettings.deviceScale;

			for ( var i=0; i<total; i++ )
			{
				if ( data[i].hasOwnProperty( "event" ))
				{
					event = new Distilled.GameEvent( this.mGame, data[i], this.mSettings );
					event.x = data[i].x;
					event.y = y;

					this.addChild( event );

					this.mEvents.push( event );
				}
			}

		},






	/******************************************/
	/*	Event Handlers
	/******************************************/


	});

	// Assign the class to the Distilled object
	this.Distilled.GameEvents = GameEvents;

	// Return the class
	return GameEvents;

}());


(function(){


	// Get the Distilled object or create it
	this.Distilled = this.Distilled || {};


	// Create the class
	var GameSettings = function() {

		this._init();
	}


	// Add the properties to the class
	GameSettings.prototype = {


	/******************************************/
	/*	Public Vars
	/******************************************/

		width 						: window.innerWidth,
		height 						: window.innerHeight,
		maxWindowWidth				: window.innerWidth,
		renderer 					: Phaser.AUTO,
		// renderer 					: Phaser.CANVAS,
		// scaleMode					: Phaser.ScaleManager.RESIZE,
		scaleMode					: Phaser.ScaleManager.SHOW_ALL,
		scaleToDevice				: true,
		deviceScale					: 1,
		maxDeviceScale				: 1.5,
		debug 						: false,
		drawTerrain 				: true,
		antialias					: false,
		smoothed					: true,
		paused						: true,
		zoom 						: 50,
		scaler 						: 1,
		density						: 1,
		friction					: 10,
		restitution					: 0.1,
		autoCull					: false,
		uiFontSize					: 20,

		volume : {
			music1 					: 0.2,
			music2 					: 0.15,
			scratch 				: 0.3,
			thud 					: 0.3,
			crunch 					: 0.4,
			milestone 				: 0.5,
			engineStart 			: 0.1,
			engineLoop 				: 0.05,
			success					: 0.3,
			failure					: 0.5,
			button					: 0.3,
		},

		data : {
			flipAxis				: true,
			valueXSpace 			: 40,
			valueYMultiplier 		: 3000,
			positionOffsetX 		: 300,
			positionOffsetY 		: 500
		},

		bus : {
			speed 					: 116,
			// bodyVerticies 			: [-73,-26,-73,25,-66,32,61,32,73,21,73,-6,44,-32,-67,-32],
			// bodyVerticies 			: [-1.71,-0.609,-1.71,0.586,-1.546,0.75,1.429,0.75,1.711,0.492,1.711,-0.141,1.031,-0.75,-1.569,-0.75],
			bodyVerticies			: [-100.62,-31.177,-102.681,12.6,-90.62,34.807,-76.657,44.555,79.001,44.555,88.236,33.247,95.109,19.211,95.109,-8.355,72.806,-41.56,-88.021,-44.56],
			// bodyVerticies			: [-89,44,80,44,103,5,74,-42,-89,-42],
			scaleBodyVerticies		: false,

			wheels: [
				{
					frequency 		: 3.5,
					damping 		: 3.5,
					motorTorque 	: 26,
					rideHeight 		: 1.0,
					positionX 		: -1.4,
					positionY 		: 0.6
				},
				{
					frequency 		: 3.5,
					damping 		: 3.5,
					motorTorque 	: 26,
					rideHeight 		: 1.0,
					positionX 		: -0.25,
					positionY 		: 0.6
				},
				{
					frequency 		: 3.5,
					damping 		: 3.5,
					motorTorque 	: 26,
					rideHeight 		: 1.0,
					positionX 		: 1.4,
					positionY 		: 0.6
				}
			]
		},

		camera : {
			// ease : 0.08,
			easeX : 0.03,
			easeY : 0.01,
		},




		resize : function()
		{
			// Get the max window width
			this.maxWindowWidth = Math.max( window.innerWidth, window.innerHeight );

			// Get the scale
			var scale = this._getScale();

			// Calculate the width and height
			this.width = window.innerWidth * scale;
			this.height = window.innerHeight * scale;

			// Check to see if we are in portrait or landscape
			if ( this.width > this.height )
			{
				this.portrait = null;
				this.landscape = true;
				this.camera.easeX = 0.05;
			}
			else
			{
				this.portrait = true;
				this.landscape = false;
				this.camera.easeX = 0.1;
			}
		},



		_init : function()
		{
			this.resize();
		},



		_getScale : function()
		{
			// if ( this.scaleToDevice == true )
			if ( this.scaleToDevice == true && this.maxWindowWidth < 1024 )
			{
				this.deviceScale = ( window.devicePixelRatio >= this.maxDeviceScale ) ? this.maxDeviceScale : window.devicePixelRatio;

				if ( $d.IS_IN_IFRAME == true )
				{
					this.deviceScale = this.maxDeviceScale;
				}
			}
			else
				this.deviceScale = 1;

			return this.deviceScale
		},


	};

	// Assign the class to the Distilled object
	this.Distilled.GameSettings = GameSettings;

	// Return the class
	return GameSettings;

}());


(function(){


	// Get the Distilled object or create it
	this.Distilled = this.Distilled || {};


	// Create the class
	var GameSettingsMobile = function()
	{
		this._init();
	}

	GameSettingsMobile.prototype = Object.create( Distilled.GameSettings.prototype );
	GameSettingsMobile.prototype.constructor = GameSettingsMobile;



	// Add the properties to the class
	Object.assign( GameSettingsMobile.prototype, {


	/******************************************/
	/*	Public Vars
	/******************************************/

		_init : function()
		{
			// GENERAL
			this.scaler = 0.75;
			this.uiFontSize = 14,

			// BUS
			this.bus.speed = 110;

			this.bus.wheels[0].frequency = 6;
			this.bus.wheels[0].damping = 3.5;
			this.bus.wheels[0].motorTorque = 16;
			this.bus.wheels[0].rideHeight = 0.8;
			this.bus.wheels[0].positionX = -1.1
			this.bus.wheels[0].positionY = 0.3;

			this.bus.wheels[1].frequency = 6;
			this.bus.wheels[1].damping = 3.5;
			this.bus.wheels[1].motorTorque = 16;
			this.bus.wheels[1].rideHeight = 0.8;
			this.bus.wheels[1].positionX = -0.24
			this.bus.wheels[1].positionY = 0.3;

			this.bus.wheels[2].frequency = 6;
			this.bus.wheels[2].damping = 3.5;
			this.bus.wheels[2].motorTorque = 16;
			this.bus.wheels[2].rideHeight = 0.8;
			this.bus.wheels[2].positionX = 1.1
			this.bus.wheels[2].positionY = 0.3;

			// CAMERA
			this.camera.easeX = 0.05;

		},


	});

	// Assign the class to the Distilled object
	this.Distilled.GameSettingsMobile = GameSettingsMobile;

	// Return the class
	return GameSettingsMobile;

}());


(function(){


	// Get the Distilled object or create it
	this.Distilled = this.Distilled || {};


	// Create the class
	var Game = function()
	{
		// Initalise the class
		this._init();
	}


	Game.prototype = Object.create( Distilled.Events.prototype );
	Game.prototype.constructor = Game;



	// Add the properties to the class
	Object.assign( Game.prototype, {


	/******************************************/
	/*	Public Vars
	/******************************************/


	/******************************************/
	/*	Private Vars
	/******************************************/

		mGame 			: null,
		mBus 			: null,
		mTerrain	 	: null,
		mClouds 		: null,
		mBG 			: null,
		mUIVertical		: null,
		mUIVertical 	: null,
		mEvents			: null,
		mProgress		: null,
		mSettings 		: null,



	/******************************************/
	/*	Public Functions
	/******************************************/

		show : function()
		{
			// Show the canvas
			$d.addClass( this.mGame.renderer.view, "show" );
		},



		play : function()
		{
			Distilled.log( "[Game] PLAY" );
			// Unpause the game
			// this.mGame.paused = false;

			// Show the city
			// this.mCity.show();

			// Move the camera into position

			$d.MUTED = null;



			var self = this;
			setTimeout( function(){

				// Start the bus
				self.mBus.start();

			}, 250 );


			setTimeout( function(){

				// Fade in the misic
				self.mMusic1.play( "", 0, 0 );
				self.mMusic1.fadeTo( 2000, self.mSettings.volume.music1 );

			}, 1000 );

		},



		restart : function()
		{
			this.mHitReferendum = null;

			// Play the music
			// this.mMusic1.loopFull( this.mSettings.volume.music );

			this.mBus.restart();
			// this.mBus.start();

			this._setCamera();
		},



		stop: function()
		{
			Distilled.log( "[Game] STOPPED" );
			// Pause the game
			// this.mGame.paused = true;

			this.mMusic1.stop();
			this.mMusic2.stop();
		},



		playButtonSFX : function()
		{
			if ( !this.mSFXButton )
				return;

			this.mSFXButton.play( "",0, this.mSettings.volume.button );
		},




	/******************************************/
	/*	Private Functions
	/******************************************/

		_init : function()
		{
			Distilled.log( "[Game] INIT" );


			var maxWidth = Math.max( window.innerWidth, window.innerHeight )

			// if ( maxWidth >= 768 )
				this.mSettings = new Distilled.GameSettings();
			// else
			// 	this.mSettings = new Distilled.GameSettingsMobile();

			// Setup the Audio
			// window.PhaserGlobal = { audioContext: createAudioContext(44100) };


			var config = {
				id: "game",
				width: this.mSettings.width,
				height: this.mSettings.height,
				renderer: this.mSettings.renderer,
				antialias: this.mSettings.antialias,
				multiTexture: true,
				enableDebug: this.mSettings.debug,
				state: {
					loadUpdate: this._loadUpdate.bind(this),
					preload: this._preload.bind(this),
					create: this._create.bind(this),
					update: this._update.bind(this),
				}
			};

			// Check to see if debug is enabled
			if ( this.mSettings.debug == true )
			{
				config.state.render = this._render.bind(this);
				config.state.update = this._updateDebug.bind(this);
			}

			// Create the game
			this.mGame = new Phaser.Game( config );
		},



		_addEventListeners : function()
		{
			var self = this;

			// Add an event listener to listen for hitting the referendum
			$d.on( "event_referendum", this._onHitReferendum, this );

			// Add a resize event listener to the window so we can update positions
			window.addEventListener( "resize", function(e){ return self._onWindowResize( e ); });
			// window.addEventListener( "orientationchange", function(e){ return self._onWindowResize( e ); });
		},




		_loadUpdate : function()
		{
			Distilled.log( "[Game] LOADING:", this.mGame.load.progress +"%" );
		},




		_preload : function()
		{
			Distilled.log( "[Game] PRELOAD" );

			// FONT
			// this.mGame.load.bitmapFont( "helvetica", "assets/spritesheets/helvetica_neue_font.png", "assets/spritesheets/helvetica_neue_font.xml" );

			// FONT DATA
			this.mGame.load.xml( "helveticaData", "assets/spritesheets/helvetica_neue_font.xml" );

			// TEXTURE ATLAS
			this.mGame.load.atlas( "assetsAtlas", "assets/spritesheets/game_assets.png", "assets/spritesheets/game_assets.json", null, Phaser.Loader.TEXTURE_ATLAS_JSON_HASH );

			// AUDIO
			this.mGame.load.audio( "button", [ "assets/audio/button.mp3" ]);
			this.mGame.load.audio( "crunch", [ "assets/audio/crunch.mp3" ]);
			this.mGame.load.audio( "engine", [ "assets/audio/engine1.mp3" ]);
			// this.mGame.load.audio( "engine2", [ "assets/audio/engine2.mp3" ]);
			this.mGame.load.audio( "failure", [ "assets/audio/failure.mp3" ]);
			this.mGame.load.audio( "milestone", [ "assets/audio/milestone.mp3" ]);
			this.mGame.load.audio( "music1", [ "assets/audio/music1.mp3" ]);
			this.mGame.load.audio( "music2", [ "assets/audio/music2.mp3" ]);
			// this.mGame.load.audio( "rev1", [ "assets/audio/rev1.mp3" ]);
			// this.mGame.load.audio( "rev2", [ "assets/audio/rev2.mp3" ]);
			// this.mGame.load.audio( "rev3", [ "assets/audio/rev3.mp3" ]);
			this.mGame.load.audio( "scratch", [ "assets/audio/scratch.mp3" ]);
			this.mGame.load.audio( "start", [ "assets/audio/start.mp3" ]);
			this.mGame.load.audio( "success", [ "assets/audio/success.mp3" ]);
			this.mGame.load.audio( "thud1", [ "assets/audio/thud1.mp3" ]);
			this.mGame.load.audio( "thud2", [ "assets/audio/thud2.mp3" ]);
			this.mGame.load.audio( "thud3", [ "assets/audio/thud3.mp3" ]);
		},




		_create : function()
		{
			// Trigger the loaded event
			this.trigger( "event_loaded" );

			Distilled.log( "[Game] CREATE" );
			Distilled.log( "[Game] AUDIO LOCKED:", this.mGame.sound.touchLocked );

			//
			// PIXI.scaleModes.DEFAULT = PIXI.scaleModes.NEAREST;

			// Setup the game properties
			this._setupGame();

			// Add the button SFX
			this.mSFXButton = this.mGame.add.audio( "button" );

			// Get the game data
			this.mData = new Distilled.Data( this.mSettings );


			// Set the properties on the Distilled core so we can access them from the developer console
			$d.controller 	= this;
			$d.game 		= this.mGame;
			$d.settings 	= this.mSettings;
			$d.data 		= this.mData;


			// Create the objects
			if ( this.mSettings.debug == true )
				this._createDebugObjects();
			else
				this._createObjects();


			// Set the game Bounds
			this._setGameBounds();

			// Set the camera
			this._setCamera();

			// Setup the mute button
			this._setupMuteButton();

			// Play the game music
			this._playMusic();


			// Destroy the input
			this.mGame.input.destroy();

			// Enable the controls
			$d.enableControls();


			// if ( this.mSettings.paused == true )
			// {
			// 	var self = this;
			// 	// Pause the game
			// 	setTimeout( function(){
			// 		Distilled.log( "[Game] START PAUSED" );
			// 		self.mGame.paused = true;
			// 	}, 500 );
			// }


			// Add any event listeners
			this._addEventListeners();

			// Trigger the ready event
			this.trigger( "event_ready" );
		},



		_update : function()
		{
			// return;
			this.mCameraVX = ((this.mBus.mBody.x - (this.mSettings.width * 0.25)) - this.mGame.camera.x ) * this.mSettings.camera.easeX;
			// var currentX = this.mGame.camera.x;
			// var targetX = this.mBus.mBody.x - (window.innerWidth * 0.25);
			// var dx = targetX - currentX
			// var vx = dx * 0.03;

			this.mCameraVY = ((this.mTerrain.focusY - (this.mSettings.height * 0.6)) - this.mGame.camera.y ) * this.mSettings.camera.easeY;
			// var currentY = this.mGame.camera.y;
			// var targetY = this.mTerrain.focusY - ( window.innerHeight * 0.5 );
			// var dy = targetY - currentY;
			// var vy = dy * 0.006;

			this.mGame.camera.x += this.mCameraVX;
			this.mGame.camera.y += this.mCameraVY;


			// Distilled.log( "[Game] FOCUS:", this.mTerrain.focusY )
			// Distilled.log( "[Game] WINDOW HEIGHT:", window.innerHeight )
			// Distilled.log( "[Game] CAMERA Y:", this.mGame.camera.y );

			// Distilled.log( "[Game] CAMERA VX:", this.mCameraVX )
			// Distilled.log( "[Game] CAMERA VY:", this.mCameraVY )

			// Update the UI progress
			this.mUIProgress.setProgress(( this.mBus.mBody.x - this.mData.startPos ) / this.mLength );

			// Distilled.log( "[Game] UPDATING");
		},



		_updateDebug : function()
		{
			this.mCameraVX = ((this.mBus.mBody.x - (this.mSettings.width * 0.25)) - this.mGame.camera.x ) * this.mSettings.camera.easeX;
			this.mCameraVY = ((this.mTerrain.focusY - (this.mSettings.height * 0.6)) - this.mGame.camera.y ) * this.mSettings.camera.easeY;
			this.mGame.camera.x += this.mCameraVX;
			this.mGame.camera.y += this.mCameraVY;
		},



		_render : function()
		{
			this.mGame.debug.box2dWorld();
		},



		_setupGame : function()
		{
			// Set the background color
			this.mGame.stage.backgroundColor = "#000000";
			this.mGame.stage.smoothed = this.mSettings.smoothed;

			// Enable the Box2D Physics
			this.mGame.physics.startSystem( Phaser.Physics.BOX2D );
			this.mGame.physics.box2d.gravity.y = 500;
			this.mGame.physics.box2d.ptmRatio = this.mSettings.zoom;
			this.mGame.physics.box2d.density = this.mSettings.density;
			this.mGame.physics.box2d.friction = this.mSettings.friction;
			this.mGame.physics.box2d.restitution = this.mSettings.restitution;

			// Enable the advanced timing
			// this.mGame.time.advancedTiming = true;

			// If we are not in debug mode
			if ( this.mSettings.debug == false )
			{
				// Stop the clear before rendering - saves a draw call
				this.mGame.clearBeforeRender = false;

				// Setup texture priority to reduce draw calls
				var enabled = this.mGame.renderer.setTexturePriority([ "assetsAtlas" ]);

				// if ( enabled.length < this.mGame.renderer.maxTextures )
				// {
				// 	this.mGame.cache.getBitmapFont( "helvetica" ).base.textureIndex = enabled.length + 1;
				// }
			}

			this.mGame.renderer.renderSession.roundPixels = false;

			this.mGame.input.enabled = false;
			//
			// this.mGame.preserveDrawingBuffer = true;

			// this.mGame.cache.addBitmapFont( "helvetica", "assets/spritesheets/game_assets.png", this.mGame.cache.getFrameByName( "assetsAtlas", "helvetica_neue_font" ), this.mGame.cache.getXML( "helveticaXml" ), "xml" );
			this.mGame.cache.addBitmapFontFromAtlas( "helvetica", "assetsAtlas", "helvetica_neue_font_white", "helveticaData", "xml", 0, 0 );
			this.mGame.cache.addBitmapFontFromAtlas( "helvetica_b", "assetsAtlas", "helvetica_neue_font_black", "helveticaData", "xml", 0, 0 );
			this.mGame.cache.getBaseTexture( "assetsAtlas" ).sclaeMode = PIXI.scaleModes.NEAREST;

			// Set the scaling
			// this.mGame.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
			// this.mGame.scale.refresh();
			this.mGame.scale.scaleMode = this.mSettings.scaleMode;
			this.mGame.scale.refresh();
			// this.mGame.scale.parentIsWindow = true;
			// this.mGame.scale.refresh();

			this.mGame.input.mouse.capture = true;

			// this.mGame.sound.mute = this.muted;

		},



		_createObjects : function()
		{
			// Distilled.log( "[Game] CREATE OBJECTS" );

			// Create the background
			this.mBG = new Distilled.GameBackground( this.mSettings, this.mGame, this.mData );

			// Create the clouds
			this.mClouds = new Distilled.GameClouds( this.mSettings, this.mGame, this.mData );

			// Create the city background
			this.mCity = new Distilled.GameCity( this.mSettings, this.mGame, this.mData );

			// Create the terrain
			this.mTerrain = new Distilled.GameTerrain( this.mSettings, this.mGame, this.mData );

			// Create the Data Axis UI
			this.mUIVertical = new Distilled.GameUIVertical( this.mSettings, this.mGame, this.mData );
			this.mUIHorizontal = new Distilled.GameUIHorizontal( this.mSettings, this.mGame, this.mData );

			// Create the progress bar
			this.mUIProgress = new Distilled.GameUIProgress( this.mSettings, this.mGame, this.mData );

			// Create the events
			this.mEvents = new Distilled.GameEvents( this.mSettings, this.mGame, this.mData );

			// Create the bus
			this.mBus = new Distilled.GameBus( this.mSettings, this.mGame, this.mData );
			this.mBus.setupContactCallback( this.mTerrain.getPhysicsBody() );

			// return;

			// Get the length of the Graph
			this.mLength = this.mData.finishLine - this.mData.startPos;

			// Distilled.log( "[Game] FINISH LINE:", this.mData.finishLine );
			// Distilled.log( "[Game] START POS:", this.mData.startPos );
			// Distilled.log( "[Game] LENGTH:", this.mLength );
		},



		_createDebugObjects : function()
		{
			Distilled.log( "[Game] CREATE DEBUG" );

			// Create the terrain
			this.mTerrain = new Distilled.GameTerrain( this.mSettings, this.mGame, this.mData );

			// Create the bus
			this.mBus = new Distilled.GameBus( this.mSettings, this.mGame, this.mData );
		},



		_setGameBounds : function()
		{
			var bounds = this.mData.bounds;
			var startY = this.mData.startY;

			// Distilled.log( "[Game] BOUNDS:", bounds );

			// Setup the world bounds
			this.mGame.world.setBounds( -2000, -10000, bounds.width+4000, bounds.height+10000 );

			if ( this.mBus )
			{
				// Set the bus start Y
				this.mBus.startY( startY );
			}
		},



		_setCamera : function()
		{
			// return;
			// if ( this.mBus )
			// {
			// 	var offset = this.mGame.width*0.25;

			// 	// Make the camera follow the bus
			// 	this.mGame.camera.follow( this.mBus.getBody(), Phaser.Camera.FOLLOW_LOCKON, this.mSettings.camera.easeX, this.mSettings.camera.easeY );
			// 	this.mGame.camera.targetOffset.set( offset, 0 );

			// 	this.mGame.camera.x = this.mData.startPos - offset;
			// }

			this.mCameraVX = this.mBus.mBody.x - ( this.mSettings.width * 0.25 );
			// var currentX = this.mGame.camera.x;
			// var targetX = this.mBus.mBody.x - (window.innerWidth * 0.25);
			// var dx = targetX - currentX
			// var vx = dx * 0.03;

			// var focus =  //- ((this.mTerrain.focusY - this.mBus.mBody.y) * 0.5)

			this.mCameraVY = this.mTerrain.startY - ( this.mSettings.height * 0.6 );
			// var currentY = this.mGame.camera.y;
			// var targetY = this.mTerrain.focusY - ( window.innerHeight * 0.5 );
			// var dy = targetY - currentY;
			// var vy = dy * 0.006;

			// Distilled.log( "[Game] FOCUS:", this.mTerrain.focusY )
			// Distilled.log( "[Game] WINDOW HEIGHT:", window.innerHeight )
			// Distilled.log( "[Game] CAMERA Y:", this.mGame.camera.y );

			// Distilled.log( "[Game] CAMERA VX:", this.mCameraVX )
			// Distilled.log( "[Game] CAMERA VY:", this.mCameraVY )

			this.mGame.camera.x = this.mCameraVX;
			this.mGame.camera.y = this.mCameraVY;
		},



		_setupMuteButton : function()
		{
			var self = this;

			this.mAudioBtn = document.getElementById( "mute_btn" );
			this.mAudioBtn.addEventListener( "click", function(e){
				e.preventDefault()
				self._onToggeMute();
				return false
			})

			// var audioSupported = this.mGame.audioSupported();
			var audioSupported = $d.AUDIO_SUPPORTED;
		},



		_playMusic : function()
		{
			this.mMusic1 = this.mGame.add.audio( "music1", this.mSettings.volume.music1, true );
			this.mMusic2 = this.mGame.add.audio( "music2", this.mSettings.volume.music2, true );
			this.mSFXScratch = this.mGame.add.audio( "scratch", this.mSettings.volume.scratch );
		},



		_resize : function()
		{
			this.mSettings.resize();

			this.mGame.scale.setGameSize( this.mSettings.width, this.mSettings.height );
			this.mGame.scale.refresh();

			this.mBG.resize();
			this.mCity.resize();
			this.mClouds.resize();
			this.mTerrain.resize();
			this.mUIVertical.resize();
			this.mUIHorizontal.resize();


			// Distilled.log( "[Game] RESIZE:", this.mGame.width, this.mGame.height );
		},




		_changeMusic : function()
		{
			var self = this;

			if ( this.mHitReferendum )
			{
				if ( this.mMusic1.isPlaying == false )
					return;

				this.mMusic1.stop();
				this.mSFXScratch.play( "", 0, this.mSettings.volume.scratch );

				setTimeout( function(){
					self.mMusic2.loopFull( self.mSettings.volume.music2 );
				}, 1000 );
			}
			else
			{
				if ( this.mMusic2.isPlaying == false )
					return;

				this.mMusic2.stop();
				this.mSFXScratch.play( "", 0, this.mSettings.volume.scratch );

				setTimeout( function(){
					self.mMusic1.loopFull( self.mSettings.volume.music1 );
				}, 1000 );
			}
		},








	/******************************************/
	/*	Event Handlers
	/******************************************/



		_onHitReferendum : function( e )
		{
			this.mHitReferendum = true;

			this._changeMusic();
		},



		_onWindowResize : function( e )
		{
			if ( e ) e.preventDefault();

			this._resize();

			var self = this;

			clearTimeout( this._resizeTimeout )

			this._resizeTimeout = setTimeout( function(){
				self._resize();
			}, 500 );

			return false;
		},



		_onToggeMute : function()
		{
			$d.toggleClass( this.mAudioBtn, "audio_on" );

			if ( $d.hasClass( this.mAudioBtn, "audio_on" ))
			{
				this.mGame.sound.mute = false;
			}
			else
			{
				this.mGame.sound.mute = true;
			}

			Distilled.log( "[Game] TOGGLE MUTE:", this.mGame.sound.mute );
		},



	});

	// Assign the class to the Distilled object
	this.Distilled.Game = Game;

	// Return the class
	return Game;

}());


(function(){


	// Get the Distilled object or create it
	this.Distilled = this.Distilled || {};


	// Create the class
	var Background = function()
	{
		// Initalise the class
		this._init();
	}


	Background.prototype = Object.create( Distilled.Events.prototype );
	Background.prototype.constructor = Background;



	// Add the properties to the class
	Object.assign( Background.prototype, {


	/******************************************/
	/*	Public Vars
	/******************************************/


	/******************************************/
	/*	Private Vars
	/******************************************/

		mBackground : null,



	/******************************************/
	/*	Public Functions
	/******************************************/

		hide : function()
		{
			$d.addClass( this.mBackground, "hide" );
		},


		show : function()
		{
			$d.removeClass( this.mBackground, "hide" );
		},



	/******************************************/
	/*	Private Functions
	/******************************************/

		_init : function()
		{
			// Get the intro element
			this.mBackground = document.getElementById( "background" );

			// Add the event listeners
			// this._addEventListeners();
		},



		// _addEventListeners : function()
		// {
		// 	var self = this;
		// 	var playBtn = document.getElementById( "instructions_play_btn" );

		// 	// Read more button
		// 	playBtn.addEventListener( "click", function(e){ return self._onBtnClick(e); }, false );

		// },






	/******************************************/
	/*	Event Handlers
	/******************************************/

		// _onBtnClick : function( e, dir )
		// {
		// 	e.preventDefault();

		// 	this.trigger( "event_play" );

		// 	return false;
		// },





	});

	// Assign the class to the Distilled object
	this.Distilled.Background = Background;

	// Return the class
	return Background;

}());


(function(){


	// Get the Distilled object or create it
	this.Distilled = this.Distilled || {};


	// Create the class
	var Intro = function()
	{
		// Initalise the class
		this._init();
	}


	Intro.prototype = Object.create( Distilled.Events.prototype );
	Intro.prototype.constructor = Intro;



	// Add the properties to the class
	Object.assign( Intro.prototype, {


	/******************************************/
	/*	Public Vars
	/******************************************/


	/******************************************/
	/*	Private Vars
	/******************************************/

		mIntro : null,



	/******************************************/
	/*	Public Functions
	/******************************************/

		hide : function()
		{
			$d.addClass( this.mIntro, "hide" );

			var self = this;
			setTimeout( function(){
				self.mIntro.style.display = "none";
			}, 500 )
		},



		ready : function()
		{
			$d.addClass( this.mIntro, "ready" );
		},



	/******************************************/
	/*	Private Functions
	/******************************************/

		_init : function()
		{
			// Get the intro element
			this.mIntro = document.getElementById( "intro" );

			// Add the event listeners
			this._addEventListeners();
		},



		_addEventListeners : function()
		{
			var self = this;
			var playBtn = document.getElementById( "intro_play_btn" );

			// Read more button
			playBtn.addEventListener( "click", function(e){ return self._onBtnClick(e); }, false );

		},






	/******************************************/
	/*	Event Handlers
	/******************************************/

		_onBtnClick : function( e, dir )
		{
			e.preventDefault();

			this.trigger( "event_play" );

			return false;
		},





	});

	// Assign the class to the Distilled object
	this.Distilled.Intro = Intro;

	// Return the class
	return Intro;

}());


(function(){


	// Get the Distilled object or create it
	this.Distilled = this.Distilled || {};


	// Create the class
	var Instructions = function()
	{
		// Initalise the class
		this._init();
	}


	Instructions.prototype = Object.create( Distilled.Events.prototype );
	Instructions.prototype.constructor = Instructions;



	// Add the properties to the class
	Object.assign( Instructions.prototype, {


	/******************************************/
	/*	Public Vars
	/******************************************/


	/******************************************/
	/*	Private Vars
	/******************************************/

		mInstructions : null,



	/******************************************/
	/*	Public Functions
	/******************************************/

		hide : function()
		{
			$d.removeClass( this.mInstructions, "show" );

			var self = this;
			setTimeout( function(){
				self.mInstructions.style.display = "none";
			}, 500 )
		},


		show : function()
		{
			this.mInstructions.style.display = "block";

			$d.addClass( this.mInstructions, "show" );
		},



	/******************************************/
	/*	Private Functions
	/******************************************/

		_init : function()
		{
			// Get the intro element
			this.mInstructions = document.getElementById( "instructions" );

			// Add the event listeners
			this._addEventListeners();
		},



		_addEventListeners : function()
		{
			var self = this;
			var playBtn = document.getElementById( "instructions_play_btn" );

			// Read more button
			playBtn.addEventListener( "click", function(e){ return self._onBtnClick(e); }, false );

		},






	/******************************************/
	/*	Event Handlers
	/******************************************/

		_onBtnClick : function( e, dir )
		{
			e.preventDefault();

			this.trigger( "event_play" );

			return false;
		},





	});

	// Assign the class to the Distilled object
	this.Distilled.Instructions = Instructions;

	// Return the class
	return Instructions;

}());


(function(){


	// Get the Distilled object or create it
	this.Distilled = this.Distilled || {};


	// Create the class
	var Popover = function( id )
	{
		this.mID = id;

		// Initalise the class
		this._init();
	}


	Popover.prototype = Object.create( Distilled.Events.prototype );
	Popover.prototype.constructor = Popover;



	// Add the properties to the class
	Object.assign( Popover.prototype, {


	/******************************************/
	/*	Public Vars
	/******************************************/


	/******************************************/
	/*	Private Vars
	/******************************************/

		mPopover : null,
		mID: null,



	/******************************************/
	/*	Public Functions
	/******************************************/

		hide : function()
		{
			$d.removeClass( this.mPopover, "show" );

			var self = this;
			setTimeout( function(){
				self.mPopover.style.display = "none";
			}, 500 )
		},


		show : function( data )
		{
			this.mPopover.style.display = "block";


			var daysEl = document.getElementById( this.mID+"_days" );

			if ( daysEl ) daysEl.innerHTML = ""+ data.days;


			var timeEl = document.getElementById( this.mID+"_time" )

			if ( timeEl ) timeEl.innerHTML = ""+ data.time;


			var self = this;
			setTimeout( function(){
				$d.addClass( self.mPopover, "show" );
			}, 100 )
		},



	/******************************************/
	/*	Private Functions
	/******************************************/

		_init : function()
		{
			// Get the intro element
			this.mPopover = document.getElementById( this.mID );

			// Add the event listeners
			this._addEventListeners();
		},



		_addEventListeners : function()
		{
			var self = this;
			var playBtn = document.getElementById( this.mID+"_play_btn" );

			// Read more button
			playBtn.addEventListener( "click", function(e){ return self._onBtnClick(e); }, false );

		},






	/******************************************/
	/*	Event Handlers
	/******************************************/

		_onBtnClick : function( e, dir )
		{
			e.preventDefault();

			this.trigger( "event_play" );

			return false;
		},





	});

	// Assign the class to the Distilled object
	this.Distilled.Popover = Popover;

	// Return the class
	return Popover;

}());


(function(){


	// Get the Distilled object or create it
	this.Distilled = this.Distilled || {};


	// Create the class
	var View = function()
	{
		// Initalise the class
		this._init();
	}


	View.prototype = Object.create( Distilled.Events.prototype );
	View.prototype.constructor = View;



	// Add the properties to the class
	Object.assign( View.prototype, {


	/******************************************/
	/*	Public Vars
	/******************************************/



	/******************************************/
	/*	Private Vars
	/******************************************/

		mBackground: null,
		mIntro : null,
		mComplete: null,
		mFail: null,
		mGame : null,
		mSharing: null,



	/******************************************/
	/*	Public Functions
	/******************************************/



	/******************************************/
	/*	Private Functions
	/******************************************/

		_init : function()
		{
			// MUTE THE GAME AUDIO
			$d.MUTED = true;

			// Create the background
			this._createBackground();

			// Create the intro screen
			this._createIntro();

			// Create the instructions screen
			this._createInstructions();

			// Create the complete screen
			this._createFail();

			// Create the complete screen
			this._createComplete();

			// Create the explorer screen
			this._createGame();

			// Create the sharing
			this._createSharing();


			// Listen for the complete event
			$d.on( "event_complete", this._onGameComplete, this );
			// $d.on( "event_stopped", this._onGameStopped, this );
			$d.on( "event_dead", this._onGameDead, this );
		},



		_createSharing : function()
		{
			// Advisa FB ID
			// this.mSharing = new Distilled.Sharing( "630857877122242" );

			// TEST FB ID
			this.mSharing = new Distilled.Sharing( "211519799388528" );
		},



		_createBackground : function()
		{
			this.mBackground = new Distilled.Background();
		},



		_createIntro : function()
		{
			this.mIntro = new Distilled.Intro();
			this.mIntro.on( "event_play", this._onIntroPlay, this );
		},



		_createInstructions : function()
		{
			this.mInstructions = new Distilled.Instructions();
			this.mInstructions.on( "event_play", this._onInstructionsPlay, this );
		},



		_createComplete : function()
		{
			this.mComplete = new Distilled.Popover( "complete" );
			this.mComplete.on( "event_play", this._onRestart, this );
		},



		_createFail : function()
		{
			this.mFail = new Distilled.Popover( "fail" );
			this.mFail.on( "event_play", this._onRestart, this );
		},



		_createGame : function()
		{
			this.mGame = new Distilled.Game();
			this.mGame.on( "event_ready", this._onGameReady, this );
			this.mGame.on( "event_loaded", this._onGameLoaded, this );
		},



		_updateSocial : function( data )
		{
			Distilled.log( "[View] COMPLETED IN:", data.time );

			var facebook, twitter;

			if ( data.complete == true )
			{
				facebook = "I completed Brexit Bus in "+ data.time +" seconds! Are you strong and stable?";
				twitter = "I completed Brexit Bus in "+ data.time +" seconds! Are you strong and stable? #BrexitBus";
			}
			else
			{
				facebook = "I drove the Brexit Bus over the £’s value for "+ data.days +" days before crashing!";
				twitter = "I drove the Brexit Bus over the £’s value for "+ data.days +" days before crashing! #BrexitBus";
			}

			this.mSharing.updateTwitterText( twitter );
			this.mSharing.updateFacebookText( facebook );
		},



		_convertTimeMinsSecs : function( millis )
		{
			var minutes = Math.floor(millis / 60000);
			var seconds = (millis % 60000 / 1000).toFixed(0);
			return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
		},

		_convertTimeSecs : function( millis )
		{
			return (millis / 1000).toFixed(0);
		},



		// _play : function()
		// {

		// },




	/******************************************/
	/*	Event Handlers
	/******************************************/

		_onIntroPlay : function()
		{
			// Distilled.log( "[View] INTRO PLAY" );

			// Hide the intro
			this.mIntro.hide();

			// Show the game
			this.mGame.show();

			// Show the instructions
			this.mInstructions.show();

			// Play the btn sfx
			this.mGame.playButtonSFX();
		},



		_onInstructionsPlay : function()
		{
			// Distilled.log( "[View] INSTRUCTIONS PLAY" );

			// Hide the instructions
			this.mInstructions.hide();

			// Hide the background
			this.mBackground.hide()

			// Play the game
			this.mGame.play();

			// Play the btn sfx
			this.mGame.playButtonSFX();

			// $d.on( "event_stopped", this._onGameStopped, this );
		},



		_onRestart : function()
		{
			// Distilled.log( "[View] RESTART" );

			// Hide the complete
			this.mFail.hide();
			this.mComplete.hide();

			// Restart the game
			this.mGame.restart();

			// Play the game
			this.mGame.play()

			// Play the btn sfx
			this.mGame.playButtonSFX();
		},



		_onGameReady : function()
		{
			Distilled.log( "[View] GAME READY" );

			this.mIntro.ready();
		},



		_onGameLoaded : function()
		{
			Distilled.log( "[View] GAME LOADED" );
		},



		_onGameComplete : function( e )
		{
			var time = this._convertTimeSecs( e.time );
			e.time = time;

			Distilled.log( "[View] ON GAME COMPLETE:", e );

			// Stop the game
			this.mGame.stop();

			// Show the complete
			this.mComplete.show( e );

			// Update the social message
			this._updateSocial( e );
		},


		// _onGameStopped : function()
		// {
		// 	// Stop the game
		// 	this.mGame.stop();

		// 	// $d.off( "event_stopped", this._onGameStopped, this );
		// },


		_onGameDead : function( e )
		{
			var time = this._convertTimeSecs( e.time );
			e.time = time;

			Distilled.log( "[View] ON GAME DEAD:", e );

			// Stop the game
			this.mGame.stop();

			// Show the complete
			this.mFail.show( e );

			// Update the social message
			this._updateSocial( e );

			// $d.off( "event_stopped", this._onGameStopped, this );
		},









	});

	// Assign the class to the Distilled object
	this.Distilled.View = View;

	// Return the class
	return View;

}());


(function(){


	// Get the Distilled object or create it
	this.Distilled = this.Distilled || {};


	// Create the class
	var Core = function()
	{
		// Initalise the class
		this._init();
	}


	Core.prototype = Object.create( Distilled.Events.prototype );
	Core.prototype.constructor = Core;



	// Add the properties to the class
	Object.assign( Core.prototype, {


	/******************************************/
	/*	Public Vars
	/******************************************/

		IS_MOBILE: null,
		IS_TABLET: null,
		IS_DESKTOP: null,
		IS_IE: null,
		HAS_TOUCH: null,

		IE_VERSION: null,

		AUDIO_SUPPORTED: null,

		HASH: null,


		EVENT_MOUSE_DOWN: null,
		EVENT_MOUSE_MOVE: null,
		EVENT_MOUSE_UP: null,
		EVENT_CLICK: null,


		SPACE : null,
		RIGHT_ARROW : null,
		D : null,
		MOUSE_DOWN: null,


		// dataHost: null,



	/******************************************/
	/*	Private Vars
	/******************************************/



	/******************************************/
	/*	Public Functions
	/******************************************/

		loaded : function( $delay )
		{
			if ( !$delay ) $delay = 500;

			setTimeout( function(){
				// Get the elements which have the "loading" class
				var e = document.getElementsByClassName( "loading" );

				// Loop through the elements and remove the class name
				for ( var i=0; i<e.length; i++ )
				{
					e[i].className = e[i].className.replace( /\bloading\b/,'' );
				}
			}, $delay );
		},



		setHash : function( $hash )
		{
			if ( $hash )
				window.location.hash = "#"+ $hash;
			else
				this._removeHash();
		},



		getParentWithClass :  function( element, className )
		{
			var child = element;
			var target = null;

			while( !target )
			{
				if ( this.hasClass( child, className ) )
				{
					target = child;
					return child;
				}
				else
				{
					child = child.parentNode;
				}
			}

			return null
		},


		toggleClass : function( el, className )
		{
			if ( el.classList )
			{
				el.classList.toggle( className );
			}
			else
			{
				// For IE9
				var classes = el.className.split(" ");
				var i = classes.indexOf( className );

				if (i >= 0)
					classes.splice(i, 1);

				else
					classes.push( className );

				el.className = classes.join(" ");
			}
		},



		hasClass: function( el, className )
		{
			if (el.classList)
				return el.classList.contains(className);

			return !!el.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'));
		},



		addClass : function(el, className)
		{
			if (el.classList)
				el.classList.add(className)
			else if (!this.hasClass(el, className))
				el.className += " " + className;
		},



		removeClass : function(el, className)
		{
			if (el.classList)
				el.classList.remove(className)
			else if (this.hasClass(el, className))
			{
				var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
				el.className = el.className.replace(reg, ' ');
			}
		},



		enableControls : function()
		{
			var self = this;

			var onKeyUp = function( e )
			{
				e.preventDefault();

				var keyCode = e.which;

				switch( keyCode )
				{
					case 32 : // Space
						// Distilled.log( "[Controls] SPACE UP" );
						self.SPACE = null;
						break;

					case 39 : // Right Arrow
						// Distilled.log( "[Controls] RIGHT UP" );
						self.RIGHT_ARROW = null;
						break;

					case 68 : // D
						// Distilled.log( "[Controls] D UP" );
						self.D = null;
						break;
				}

				// Distilled.log( "[Controls] KEY UP:", keyCode );

				return false;

			};


			var onKeyDown = function( e )
			{
				e.preventDefault();

				var keyCode = e.which;

				switch( keyCode )
				{
					case 32 : // Space
						// Distilled.log( "[Controls] SPACE DOWN" );
						self.SPACE = true;
						break;

					case 39 : // Right Arrow
						// Distilled.log( "[Controls] RIGHT DOWN" );
						self.RIGHT_ARROW = true;
						break;

					case 68 : // D
						// Distilled.log( "[Controls] D DOWN" );
						self.D = true;
						break;
				}

				return false;
			}


			if ( !this.IS_IE )
			{
				window.addEventListener( 'keydown', onKeyDown, false );
				// document.addEventListener( 'keydown', onKeyDown, true );
				// document.onkeydown = onkeydown;

				window.addEventListener( 'keyup', onKeyUp, false );
				// document.addEventListener( 'keyup', onKeyUp, true );
				// document.onkeyup = onkeyup;
			}


			var target = document.getElementsByTagName( "canvas" )[0];
			// var target = document;


			target.addEventListener( this.EVENT_MOUSE_DOWN, function( e )
			{
				e.preventDefault();

				// Distilled.log( "[Controls] MOUSE DOWN" );
				self.MOUSE_DOWN = true;

				return false;
			}, false )


			target.addEventListener( this.EVENT_MOUSE_UP, function( e )
			{
				e.preventDefault();

				// Distilled.log( "[Controls] MOUSE UP" );
				self.MOUSE_DOWN = null;

				return false;

			}, false )
		},



	/******************************************/
	/*	Private Functions
	/******************************************/

		/*
		 * Initalise the component
		 */
		_init : function()
		{
			// Distilled.log( "[Core] INIT" );

			this._getHash();

			// Get the type of device being used
			this._getDeviceType();

			// Check to see if we are running in IE
			this._checkBrowser();

			// Check to see if we have touch events
			this._checkForTouch();

			// Check for Audio Support
			this._checkAudioSupport();


			this._getEvents();


			this.isInIframe();


			// this._fixScreenSize();

			// var self = this;

			// setTimeout( function(){ self._fixScreenSize(); }, 250 );
			// setTimeout( function(){ self._fixScreenSize(); }, 500 );
			// setTimeout( function(){ self._fixScreenSize(); }, 1 );
			// setTimeout( function(){ self._fixScreenSize(); }, 2 );

			// this._scrollToBottom();

			// this._preventScroll();


			Distilled.log( "[Core] IS IE:", this.IS_IE );
			Distilled.log( "[Core] IE VERSION:", this.IE_VERSION );
			Distilled.log( "[Core] HAS TOUCH:", this.HAS_TOUCH );

			// $( window ).on( "hashchange", { self:this }, this._onHashChange );
			// $( window ).on( "resize", {self:this}, this._onResize );

			if ( this.IS_IE )
				this.addClass( document.documentElement, "is_ie" );
			else
				this.addClass( document.documentElement, "not_ie" );

			// Store this as $d on the window for quick reference
			window.$d = this;
		},



		_getHash : function( e ) {

			if ( window.location.hash )
				this.HASH = window.location.hash.substring( 1 );
			else
				this.HASH = null;

			Distilled.log( "[Core] HASH:", this.HASH );
		},



		// GET THE TYPE OF DEVICE
		_getDeviceType : function() {

			// var mobile = (/iphone|ipod|android|blackberry|opera mini|opera mobi|skyfire|maemo|windows phone|palm|iemobile|symbian|symbianos|fennec/i.test(navigator.userAgent.toLowerCase()));
			var mobile = this._isMobileCheck( navigator.userAgent||navigator.vendor||window.opera );
			var tablet = (/ipad|android 3|android|sch-i800|playbook|tablet|kindle|gt-p1000|sgh-t849|shw-m180s|a510|a511|a100|dell streak|silk/i.test(navigator.userAgent.toLowerCase()));
			var desktop = !navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|BB10|mobi|tablet|opera mini|nexus 7)/i);

			this.IS_MOBILE = ( mobile == true ) ? true : null;
			this.IS_TABLET = ( tablet == true ) ? true : null;
			this.IS_DESKTOP = ( desktop == true ) ? true : null;

			// this.IS_MOBILE = null;

			Distilled.log( "[Core] IS MOBILE:", this.IS_MOBILE );
			Distilled.log( "[Core] IS TABLET:", this.IS_TABLET );
			Distilled.log( "[Core] IS DESKTOP:", this.IS_DESKTOP );

			if ( this.IS_MOBILE )
			{
				this.IS_TABLET = false;
				this.IS_DESKTOP = false;
			}

			if ( this.IS_TABLET )
			{
				this.IS_MOBILE = false;
				this.IS_DESKTOP = false;
			}

			if ( this.IS_DESKTOP )
			{
				this.IS_MOBILE = false;
				this.IS_TABLET = false;
			}

			if ( this.IS_MOBILE )
			{
				// document.documentElement.className += " mobile";
				// $( "html" ).addClass( "mobile" );
				this.addClass( document.documentElement, "mobile" );
			}

			if ( this.IS_TABLET )
			{
				// document.documentElement.className += " tablet";
				// $( "html" ).addClass( "tablet" );
				this.addClass( document.documentElement, "tablet" );
			}

			if ( this.IS_DESKTOP )
			{
				// document.documentElement.className += " desktop";
				// $( "html" ).addClass( "desktop" );
				this.addClass( document.documentElement, "desktop" );
			}
		},



		_checkBrowser : function() {

			var ua = window.navigator.userAgent;

			// Distilled.log( "[Core] USER AGENT:", ua );

			// Test values; Uncomment to check result …

			// IE 10
			// ua = 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)';

			// IE 11
			// ua = 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko';

			// Edge 12 (Spartan)
			// ua = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36 Edge/12.0';

			// Edge 13
			// ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10586';

			var msie = ua.indexOf('MSIE ');
			if (msie > 0) {
				this.IS_IE = true;
				// IE 10 or older => return version number
				this.IE_VERSION = parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);

				return;
			}

			var trident = ua.indexOf('Trident/');
			if (trident > 0) {
				// IE 11 => return version number
				var rv = ua.indexOf('rv:');

				this.IS_IE = true;
				this.IE_VERSION = parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);

				return;
			}

			var edge = ua.indexOf('Edge/');
			if (edge > 0) {
				this.IS_IE = true;

				// Edge (IE 12+) => return version number
				this.IE_VERSION = parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);

				return;
			}

			// other browser
			this.IS_IE = null;
			this.IE_VERSION = null;
		},



		_isMobileCheck : function( a ) {

			return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4));
		},



		_checkForTouch : function() {

			this.HAS_TOUCH = 'ontouchstart' in window || ( navigator.maxTouchPoints )|| (navigator.MaxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0 );

			if ( this.HAS_TOUCH == false )
			{
				this.HAS_TOUCH = null;
				// $( "html" ).addClass( "notouch" );
				document.documentElement.className += " notouch";
			}
			else
			{
				// $( "html" ).addClass( "touch" );
				document.documentElement.className += " touch";
			}
		},



		_getEvents : function()
		{
			this.EVENT_CLICK = "click";
			this.EVENT_MOUSE_DOWN = "mousedown";
			this.EVENT_MOUSE_MOVE = "mousemove";
			this.EVENT_MOUSE_UP = "mouseup";
			// this.EVENT_ = "mousedown";

			if ( this.HAS_TOUCH )
			{
				this.EVENT_MOUSE_DOWN = "touchstart";
				this.EVENT_MOUSE_MOVE = "touchmove";
				this.EVENT_MOUSE_UP = "touchend";
			}

			if (( this.IS_IE && this.HAS_TOUCH ) || ( this.HAS_TOUCH && window.PointerEvent ))
			{
				this.EVENT_MOUSE_DOWN = "pointerdown";
				this.EVENT_MOUSE_MOVE = "pointermove";
				this.EVENT_MOUSE_UP = "pointerup";
			}

			Distilled.log( "[Core] EVENT CLICK:", this.EVENT_CLICK );
			Distilled.log( "[Core] EVENT MOUSE DOWN:", this.EVENT_MOUSE_DOWN );
			Distilled.log( "[Core] EVENT MOUSE UP:", this.EVENT_MOUSE_UP );
			Distilled.log( "[Core] EVENT MOUSE MOVE:", this.EVENT_MOUSE_MOVE );

		},



		isInIframe : function()
		{
			try {
				// return window.self !== window.top;
				if ( window.self !== window.top )
					this.IS_IN_IFRAME = true;
				else
					this.IS_IN_IFRAME = null;
			} catch (e) {
				// return true;
				this.IS_IN_IFRAME = true;
			}

			Distilled.log( "[Core] IS IN IFRAME:", this.IS_IN_IFRAME );
		},



		// _fixScreenSize : function()
		// {
		// 	// Reset the content height
		// 	$( "#content" ).height( "auto" );

		// 	// Get the inner height of the window
		// 	var height = window.innerHeight;

		// 	Distilled.log( "INNER HEIGHT:", window.innerHeight );
		// 	Distilled.log( "OUTER HEIGHT:", window.outerHeight );
		// 	Distilled.log( "CLIENT HEIGHT:", document.body.clientHeight );

		// 	// Set the new content height
		// 	$( "#content" ).height( height );
		// },



		_scrollToBottom : function()
		{
			setTimeout( function(){
				window.scrollTo( 0, 1 );
			}, 500 );
		},



		_preventScroll : function()
		{
			// Prevent IOS 10 scaling
			window.addEventListener( "gesturestart", function (e) { e.preventDefault(); })
			document.addEventListener( "gesturestart", function (e) { e.preventDefault(); });

			// Prevent touch move
			window.addEventListener( "touchmove", function(e){ e.preventDefault(); return false; }, false );
		},



		_removeHash: function()
		{
			var scrollV, scrollH, loc = window.location;

			if ("pushState" in history)
				history.pushState("", document.title, loc.pathname + loc.search);
			else {
				// Prevent scrolling by storing the page's current scroll offset
				scrollV = document.body.scrollTop;
				scrollH = document.body.scrollLeft;

				loc.hash = "";

				// Restore the scroll offset, should be flicker free
				document.body.scrollTop = scrollV;
				document.body.scrollLeft = scrollH;
			}
		},



		_checkAudioSupport : function()
		{
			var supported = this._audioSupported();

			if ( supported == true )
				this.AUDIO_SUPPORTED = true;
			else
				this.AUDIO_SUPPORTED = null;

			Distilled.log( "[Core] AUDIO SUPPORTED:", this.AUDIO_SUPPORTED );
		},


		_audioSupported : function()
		{
			var a = document.createElement('audio');
			return !!(a.canPlayType && a.canPlayType('audio/mpeg;').replace(/no/, ''));
		},



	/******************************************/
	/*	Event Handlers
	/******************************************/

		// _onHashChange : function( e )
		// {
		// 	var self = e.data.self;

		// 	// var curHash = self.HASH;

		// 	// If the has has changed and the last hash is null
		// 	// if ( !curHash )
		// 		// window.location.reload();

		// 	// Otherwise get
		// 	// self._getHash();

		// 	// if ( curHash && self.HASH && curHash !== self.HASH )
		// 	// 	window.location.reload();
		// },



		// _onResize : function( e )
		// {
		// 	var self = e.data.self;

		// 	self._fixScreenSize();

		// 	setTimeout( function(){ self._fixScreenSize(); }, 250 );
		// 	setTimeout( function(){ self._fixScreenSize(); }, 500 );
		// 	setTimeout( function(){ self._fixScreenSize(); }, 1 );
		// 	setTimeout( function(){ self._fixScreenSize(); }, 2 );
		// },



	/******************************************/
	/*	Getters / Setters
	/******************************************/


	});

	// Assign the class to the Distilled object
	this.Distilled.Core = Core;

	// Return the class
	return Core;

}());



// Get the Distilled object or create it
this.Distilled = this.Distilled || {};

// SETUP THE DEBUG VAR
Distilled.DEBUG = true;

// Setup the log function
Distilled.log = Distilled.DEBUG ? console.log.bind(window.console) : function(){};

Distilled.enableDebug = function() {
	Distilled.DEBUG = true;
	Distilled.log = Distilled.DEBUG ? console.log.bind(window.console) : function(){};
}



function onReady( e )
{
	// Remove the event listener
	// document.removeEventListener( "DOMContentLoaded", onReady );
	// window.removeEventListener( "load", onReady );

	Distilled.log( "[Main] READY STATE:", document.readyState );

	if ( Distilled.core && document.readyState == "complete" )
		$d.loaded( 0 );

	// If we already have distilled core then return
	if ( Distilled.core ) return;

	// Create the Core functionality
	Distilled.core = new Distilled.Core();

	// Create the View
	var view = new Distilled.View();
}



// Check the document loading state
// If the ready state is loading then listen for the content loaded event otherwise call ready
// if ( document.readyState == "loading" )
// 	document.addEventListener( "DOMContentLoaded", onReady );
if ( document.readyState !== "complete" )
{
	window.addEventListener( "load", onReady );
	document.addEventListener( "DOMContentLoaded", onReady );
}
else
{
	onReady();
}



// @codekit-prepend "app/eventDispatcher.js"
// @codekit-prepend "app/sharing.js"
// @codekit-prepend "app/data.js"
// @codekit-prepend "app/gameBus.js"
// @codekit-prepend "app/gameTerrain.js"
// @codekit-prepend "app/gameBackground.js"
// @codekit-prepend "app/gameUIVertical.js"
// @codekit-prepend "app/gameUIHorizontal.js"
// @codekit-prepend "app/gameUIProgress.js"
// @codekit-prepend "app/gameCity.js"
// @codekit-prepend "app/gameClouds.js"
// @codekit-prepend "app/gameEvent.js"
// @codekit-prepend "app/gameEvents.js"
// @codekit-prepend "app/gameSettings.js"
// @codekit-prepend "app/gameSettingsMobile.js"
// @codekit-prepend "app/game.js"
// @codekit-prepend "app/background.js"
// @codekit-prepend "app/intro.js"
// @codekit-prepend "app/instructions.js"
// @codekit-prepend "app/popover.js"
// @codekit-prepend "app/view.js"
// @codekit-prepend "app/core.js"
// @codekit-prepend "app/main.js"

