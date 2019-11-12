// The name of the Gmail Label that is to be checked for purging?
var LABELS_TO_DELETE = [
  "notifications-zammad",
  "notifications-metabase",
  "sipgate-krank",
  "clinq-system"
];

var TRIGGER_NAME = "dailyDeleteGmail";

// Purge messages in the above label automatically after how many days?
var DELETE_AFTER_DAYS = "4";

var TIMEZONE = "UTC";

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

function Uninstall() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
}

function dailyDeleteGmail(ev) {
  var age = new Date();
  age.setDate(age.getDate() - DELETE_AFTER_DAYS);

  var purge = Utilities.formatDate(age, TIMEZONE, "yyyy-MM-dd");
  var search =
    "(label:" + LABELS_TO_DELETE.join(" OR label:") + ") before:" + purge;
  Logger.log("PURGE: " + purge);
  Logger.log("SEARCH: " + search);

  try {
    var threads = GmailApp.search(search, 0, PAGE_SIZE);

    // Resume again in 10 minutes
    if (threads.length == PAGE_SIZE) {
      Logger.log("Scheduling follow up job...");
      ScriptApp.newTrigger(TRIGGER_NAME)
        .timeBased()
        .at(new Date(new Date().getTime() + 1000 * 60 * RESUME_FREQUENCY))
        .create();
    }

    // Move threads/messages which meet age criteria to trash
    Logger.log("Processing " + threads.length + " threads...");
    for (var i = 0; i < threads.length; i++) {
      var thread = threads[i];

      if (thread.getLastMessageDate() < age) {
        thread.moveToTrash();
      } else {
        var messages = GmailApp.getMessagesForThread(threads[i]);
        for (var j = 0; j < messages.length; j++) {
          var email = messages[j];
          if (email.getDate() < age) {
            email.moveToTrash();
          }
        }
      }
    }
  } catch (e) {}

  /* Delete the trigger that caused this (if there is one), otherwise the trigger
  seems to linger in a disabled state. Only delete if there are two, otherwise the
  nightly one seems to be getting deleted. */
  if (ev != null) {
    // Count the number of triggers.
    var triggers = ScriptApp.getProjectTriggers();
    var triggerCounter = triggers.length;

    if (triggerCounter == 2) {
      if (
        !ScriptApp.getProjectTriggers().some(function(trigger) {
          if (trigger.getUniqueId() === ev.triggerUid) {
            Logger.log("Deleting " + trigger.getUniqueId());
            ScriptApp.deleteTrigger(trigger);
            return true;
          }

          return false;
        })
      ) {
        Logger.error("Could not find trigger with id '%s'", triggerUid);
      }
    }
  }
}
