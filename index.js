var EventSource = require('eventsource');
var Twitter = require('twitter');
var request = require('request');

var es = new EventSource('https://github-firehose.herokuapp.com/events');

var client = new Twitter({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token_key: process.env.ACCESS_TOKEN_KEY,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET
});

es.on('event', function(e) {
  var data = JSON.parse(e.data)
  if(data.type === 'PullRequestEvent'){
    if(data.payload.action === 'opened'){
      var login = data.actor.login
      var searchURL = 'https://api.github.com/search/issues?q=type:pr+author:"'+login+'"&sort=created&order=asc&per_page=1&access_token='+process.env.GITHUB_TOKEN

      var options = {
        url: searchURL,
        headers: {
          'User-Agent': 'request'
        }
      };

      request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          json = JSON.parse(body)
          console.log(login + ': ' + json.total_count)
          if(json.total_count < 2) {
            var status = data.actor.login + " just sent their first open source pull request " + data.payload.pull_request.html_url
            client.post('statuses/update', {status: status}, function(error, tweet, response){
              if (!error) {
                console.log(tweet);
              } else {
                console.log(error);
              };
            });
          }
        }
      })
    }
  }
});
