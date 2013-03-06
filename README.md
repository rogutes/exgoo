exgoo
=====

Do exhaustive searches with Google Web Search

This is meant to be used as a bookmarklet. Add a bookmark in your browser with this URI:

    javascript:document.head.innerHTML='';document.body.innerHTML='Loading...';document.head.appendChild(document.createElement('script')).src="https://raw.github.com/rogutes/exgoo/master/exgoo.js";document.body.onload=function(){goo(decodeURIComponent(window.location.search.match(/q=([^&]+)/)))};void(0);

Run your search in Google and click on the bookmarklet.
