/*
const CACHE_NAME = "v2"

async function addResourcesToCache(resources) {
  let cache = await caches.open(CACHE_NAME)
  
  // await cache.addAll(resources)
}

async function cache(request, response) {
  let cache = await caches.open(CACHE_NAME)
  
  // await cache.put(request, response)
}

async function retrieve(request, preloadResponse) {
  let responseFromCache = await caches.match(request)

  if (request.url.includes("home/page.html")) {
    debugger
    console.log("responseFromCache", responseFromCache)
  }

  let promise = preloadResponse
    .then(async response => {
      console.log("then", request.url.slice(19))
      if (request.url.includes("home/page.html")) {
        debugger
        console.log("response", response)
      }
  
      try {
        response ||= await fetch(request)

        console.log("fetch", request.url.slice(19))
  
        if (request.url.includes("home/page.html")) {
          debugger
          console.log("response in promise", response)
        }
      } catch (err) {
        return new Response("Network error", {
          status : 408,
          headers : {"Content-Type" : "text/plain"}
        })
      }
  
      // cache(request, response.clone())
  
      return response
    })
    .catch(error => {
      debugger
      console.error(error)
    })

  console.log("returning", request.url.slice(19))

  return responseFromCache || promise
}

async function enableNavigationPreload() {
  if (self.registration.navigationPreload)
    await self.registration.navigationPreload.enable()
}

async function deleteCache(key)  {
  await caches.delete(key)
}

async function deleteOldCaches() {
  let keys = await caches.keys().filter(key => key !== CACHE_NAME)

  await Promise.all(keys.map(deleteCache))
}

self.addEventListener("activate", e => {
  e.waitUntil(deleteOldCaches())
})

self.addEventListener("activate", e => {
  e.waitUntil(enableNavigationPreload())
})

self.addEventListener("install", e => {
  e.waitUntil(addResourcesToCache(["no-internet.html"]))
})

self.addEventListener("fetch", e => {
  e.respondWith(retrieve(e.request, e.preloadResponse))
})
*/

async function deleteCache(key)  {
  await caches.delete(key)
}

async function deleteAllCaches() {
  let keys = await caches.keys()

  await Promise.all(keys.map(deleteCache))
}

self.addEventListener("activate", e => {
  e.waitUntil(deleteAllCaches())
})
