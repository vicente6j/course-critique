Notice we're using force-cache in nearly all of our JSON pings in this directory. The benefits are
- Telling Next.js NOT to ping our server again if it already sees the data cached. Since none of the averages
or previously computed contents inside of our JSON files are changing, it makes sense to keep it as long as
possible (and avoid potentially making unnecessary network requests).
- Faster page loads since the data is served immediately.
- Reduce server load.