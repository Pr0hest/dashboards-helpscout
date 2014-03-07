
var Batch = require('batch');
var Dates = require('date-math');
var debug = require('debug')('dashboards:helpscout');
var Helpscout = require('helpscout');
var range = require('range');
var timeago = require('timeago');
timeago.settings.strings.suffixAgo = ''; // remove "ago"

/**
 * Expose `create`.
 */

module.exports = create;

/**
 * Create a new helpscout dashboards plugin.
 *
 * @param {String} apiKey
 */

function create (apiKey, mailboxId) {
  var mailbox = Helpscout(apiKey, mailboxId);
  return function helpscout (data, callback) {
    var results = data.helpscout = data.helpscout || {};
    conversations(mailbox, function (err, convos) {
      if (err) return callback(err);
      var active = convos.filter(function (convo) {
        return convo.status === 'active';
      });

      weekly(convos, results);
      totalActive(active, results);
      userBreakdown(active, results);

      callback();
    });
  };
}

/**
 * Calculate the total active tickets.
 *
 * @param {Array|Conversation} active
 * @param {Object} results
 */

function totalActive (active, results) {
  results['total active tickets'] = active.length;
}

/**
 * Calculate the total amount of tickets over the last two weeks.
 *
 * @param {Array|Conversation} convos
 * @param {Object} results
 */

function weekly (convos, results) {
  var now = new Date();
  var weekAgo = Dates.day.shift(now, -7);
  var twoWeeksAgo = Dates.day.shift(now, -14);

  var lastWeek = userModifiedAt(convos, weekAgo, now);

  results['total tickets yesterday trailing average'] = Math.round(lastWeek.length / 7);
  results['total tickets 0-1 weeks ago'] = lastWeek.length;
  results['total tickets 1-2 weeks ago'] = userModifiedAt(convos, twoWeeksAgo, weekAgo).length;
}

/**
 * Calculate total active tickets by owner.
 *
 * @param {Array|Conversation} active
 * @param {Object} results
 */

function userBreakdown (active, results) {
  var breakdown = {};

  var oldestTime = null;
  var oldestOwner = null;

  active.forEach(function (convo) {
    var owner = convo.owner;
    if (owner) {
      var n = name(owner);
      if (!breakdown[n]) breakdown[n] = 0;
      breakdown[n] += 1;

      var userModified = (new Date(convo.userModifiedAt)).getTime();
      // track oldest
      if (!oldestTime || oldestTime > userModified) {
        oldestTime = userModified;
        oldestOwner = n;
      }
    }
  });

  results['total active tickets by owner'] = breakdown;

  results['oldest ticket time'] = new Date(oldestTime);
  results['oldest ticket owner'] = oldestOwner;
  results['oldest ticket shaming'] = oldestOwner + ': ' + timeago(new Date(oldestTime)) + ' of no response.';
}

/**
 * Get a friendly name for a conversation assigned `owner`.
 *
 * @param {Owner} owner
 * @return {String}
 */

function name (owner) {
  return owner.firstName; // + ' ' + owner.lastName.charAt(0);
}

/**
 * Get all the conversations in a Helpscout `mailbox`.
 *
 * @param {Mailbox} mailbox
 * @param {Function} callback
 */

function conversations (mailbox, callback) {
  var convos = [];
  mailbox.conversations.list(function (err, res) {
    if (err) return callback(err);
    convos.push.apply(convos, res.items);
    if (res.page === res.pages) return callback(null, convos);
    var batch = new Batch();
    batch.concurrency(20);
    range(res.page+1, res.pages+1).forEach(function (page) {
      batch.push(function (done) {
        debug('fetching conversations page %d / %d ..', page, res.pages);
        mailbox.conversations.list({ page: page }, done);
      });
    });
    batch.end(function (err, responses) {
      if (err) return callback(err);
      debug('fetched all conversation pages');
      responses.forEach(function (res) { convos.push.apply(convos, res.items); });
      callback(null, convos);
    });
  });
}

/**
 * Filter the helpscout `convos` by `start` and `end` userModifiedAt date.
 *
 * @param {Array|Conversation} convos
 * @param {Date} start
 * @param {Date} end
 * @return {Array|Conversation}
 *
 */
function userModifiedAt (convos, start, end) {
  var s = start.getTime();
  var e = end.getTime();
  return convos.filter(function (convo) {
    var userModifiedAt = (new Date(convo.userModifiedAt)).getTime();
    return userModifiedAt >= s && userModifiedAt <= e;
  });
}