var TRIGGER_NAME = "spamFilter";

// Maximum number of threads to process per run
var PAGE_SIZE = 150;

// If number of threads exceeds page size, resume job after X mins (max execution time is 6 mins)
var RESUME_FREQUENCY = 10;

/*
IMPLEMENTATION
*/
function Intialize() {
  return;
}

function Install() {
  // First run 2 mins after install
  ScriptApp.newTrigger(TRIGGER_NAME)
    .timeBased()
    .at(new Date(new Date().getTime() + 1000 * 60 * 2))
    .create();

  // Run daily there after
  ScriptApp.newTrigger(TRIGGER_NAME)
    .timeBased()
    .everyDays(1)
    .create();
}

function spamFilter() {
  var threads = GmailApp.search("is:unread in:inbox", 0, PAGE_SIZE);

  // Resume again in 10 minutes
  if (threads.length == PAGE_SIZE) {
    Logger.log("Scheduling follow up job...");
    ScriptApp.newTrigger(TRIGGER_NAME)
      .timeBased()
      .at(new Date(new Date().getTime() + 1000 * 60 * RESUME_FREQUENCY))
      .create();
  }

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
