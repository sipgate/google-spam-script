function spamFilter() {
  var threads = GmailApp.search("is:unread in:inbox");

  for (var i = 0; i < threads.length; i++) {
    var thread = threads[i];

    if (!thread.isUnread()) {
      continue;
    }

    var messages = thread.getMessages();

    var isSpam = false;

    for (var b = 0; b < messages.length; b++) {
      var message = messages[b];

      if (message.getBody().match(/ub.php/)) {
        Logger.log("[SPAM]" + message.getSubject());

        isSpam = true;

        break;
      }
    }

    if (isSpam) {
      thread.moveToSpam();

      continue;
    }
  }
}
