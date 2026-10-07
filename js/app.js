var app = angular.module("eventoraApp", []);

var EVENT_KEY = "eventoraEvents";
var REGISTRATION_KEY = "eventoraRegistrations";
var COORDINATOR_KEY = "eventoraCoordinatorApplications";
var USER_KEY = "eventoraCurrentUser";
var DEFAULT_POSTER = "images/default-event.jpg";
var MAX_POSTER_SIZE = 1.5 * 1024 * 1024;
var ALLOWED_POSTER_TYPES = ["image/jpeg", "image/png", "image/webp"];

function readList(key, fallback) {
  try {
    var value = JSON.parse(localStorage.getItem(key) || "");
    return Array.isArray(value) ? value : fallback;
  } catch (error) {
    return fallback;
  }
}

function readObject(key, fallback) {
  try {
    var value = JSON.parse(localStorage.getItem(key) || "");
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : fallback;
  } catch (error) {
    return fallback;
  }
}

function saveList(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    return false;
  }
}

function getEvents() {
  var events = readList(EVENT_KEY, null);
  if (!events) {
    events = eventoraEvents.map(function (event) {
      return angular.extend({}, event, {
        date: demoDate(event.date),
        status: "approved",
        organizerName: event.organizerName || "Eventora",
        organizerEmail: event.organizerEmail || "",
        enrollment: event.enrollment || "",
        phone: event.phone || "",
      });
    });
    saveList(EVENT_KEY, events);
  }
  return events.map(function (event) {
    event.status = event.status || "approved";
    event.organizerName = event.organizerName || "Eventora";
    event.organizerEmail = (event.organizerEmail || "").toLowerCase();
    event.about = event.about || event.description || "";
    event.description = event.description || event.about;
    event.category = event.category || "General";
    event.theme = event.theme || "theme-tech";
    event.enrollment = event.enrollment || "";
    event.phone = event.phone || "";
    var demo = eventoraEvents.find(function (item) {
      return item.id === event.id;
    });
    if (demo) {
      event.poster = demo.poster;
    } else if (!event.poster) {
      event.poster = DEFAULT_POSTER;
    }
    return event;
  });
}

function demoDate(value) {
  var date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return (
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0")
  );
}

function getRegistrations() {
  return readList(REGISTRATION_KEY, []);
}
function getCoordinatorApplications() {
  return readList(COORDINATOR_KEY, []);
}
function nextId(items, field) {
  return (
    items.reduce(function (max, item) {
      return Math.max(max, Number(item[field || "id"] || 0));
    }, 0) + 1
  );
}
function approvedEvents() {
  return getEvents().filter(function (event) {
    return event.status === "approved";
  });
}
function eventById(id) {
  return getEvents().find(function (event) {
    return event.id === id;
  });
}
function currentUser() {
  return readObject(USER_KEY, {});
}
function trimmed(value) {
  return String(value || "").trim();
}
function posterFor(event) {
  return event && event.poster ? event.poster : DEFAULT_POSTER;
}
function savePoster(file, callback) {
  if (!file || ALLOWED_POSTER_TYPES.indexOf(file.type) === -1) {
    callback(null, "Please upload a JPG, PNG, or WEBP image.");
    return;
  }
  if (file.size > MAX_POSTER_SIZE) {
    callback(null, "Poster is too large. Please upload an image under 1.5 MB.");
    return;
  }
  var reader = new FileReader();
  reader.onload = function () {
    var image = new Image();
    image.onload = function () {
      var scale = Math.min(1, 1200 / image.width, 1600 / image.height);
      var canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas
        .getContext("2d")
        .drawImage(image, 0, 0, canvas.width, canvas.height);
      var data = canvas.toDataURL("image/jpeg", 0.82);
      callback(
        data.length > 2 * 1024 * 1024 ? null : data,
        data.length > 2 * 1024 * 1024
          ? "This poster is too large to store in the browser. Please choose a smaller image."
          : null,
      );
    };
    image.onerror = function () {
      callback(null, "The selected poster could not be read.");
    };
    image.src = reader.result;
  };
  reader.onerror = function () {
    callback(null, "The selected poster could not be read.");
  };
  reader.readAsDataURL(file);
}

app.controller("HomeController", function ($scope) {
  $scope.events = approvedEvents();
});

app.controller("EventsController", function ($scope) {
  $scope.events = approvedEvents();
});

app.controller("DetailsController", function ($scope) {
  var id = parseInt(new URLSearchParams(location.search).get("id"), 10);
  $scope.event = eventById(id);
  $scope.message = !$scope.event
    ? "Event not found."
    : $scope.event.status === "pending"
      ? "This event is waiting for approval."
      : $scope.event.status === "rejected"
        ? "This event is not available."
        : "";
  if ($scope.event && $scope.event.status !== "approved") $scope.event = null;
});

app.controller("RegisterController", function ($scope) {
  var id = parseInt(new URLSearchParams(location.search).get("id"), 10);
  $scope.event = eventById(id);
  $scope.available = !!$scope.event && $scope.event.status === "approved";
  if (!$scope.available) $scope.event = null;
  $scope.form = {};
  $scope.success = false;
  $scope.duplicate = false;
  $scope.register = function () {
    if (!$scope.event) return;
    var form = $scope.form;
    var email = trimmed(form.email).toLowerCase();
    var registrations = getRegistrations();
    $scope.duplicate = registrations.some(function (registration) {
      return (
        registration.eventId === $scope.event.id && registration.email === email
      );
    });
    if ($scope.duplicate) return;
    registrations.push({
      registrationId: nextId(registrations, "registrationId"),
      eventId: $scope.event.id,
      eventTitle: $scope.event.title,
      studentName: trimmed(form.name),
      email: email,
      enrollment: trimmed(form.enrollment),
      department: form.department,
      phone: trimmed(form.phone),
      registrationDate: new Date().toISOString(),
      status: "registered",
    });
    saveList(REGISTRATION_KEY, registrations);
    $scope.success = true;
  };
});

app.controller("RegistrationsController", function ($scope) {
  $scope.registrations = getRegistrations().map(function (registration) {
    registration.event = eventById(Number(registration.eventId));
    return registration;
  });
});

app.controller("OrganizeController", function ($scope) {
  $scope.form = {};
  $scope.success = false;
  $scope.poster = null;
  $scope.posterError = "";
  $scope.selectPoster = function (file) {
    savePoster(file, function (data, error) {
      $scope.$applyAsync(function () {
        $scope.poster = data;
        $scope.posterError = error || "";
      });
    });
  };
  $scope.removePoster = function () {
    $scope.poster = null;
  };
  $scope.submit = function () {
    if (!$scope.poster) {
      $scope.posterError = "Please upload an event poster.";
      return;
    }
    var form = $scope.form;
    var events = getEvents();
    var event = {
      id: nextId(events),
      title: trimmed(form.title),
      category: trimmed(form.category),
      description: trimmed(form.description),
      about: trimmed(form.description),
      date:
        form.date instanceof Date
          ? form.date.toISOString().slice(0, 10)
          : form.date,
      time:
        form.time instanceof Date
          ? form.time.toTimeString().slice(0, 5)
          : form.time,
      venue: trimmed(form.venue),
      theme: "theme-tech",
      status: "pending",
      organizerName: trimmed(form.organizerName),
      organizerEmail: trimmed(form.organizerEmail).toLowerCase(),
      enrollment: trimmed(form.enrollment),
      phone: trimmed(form.phone),
      poster: $scope.poster,
    };
    events.push(event);
    if (!saveList(EVENT_KEY, events)) {
      $scope.posterError =
        "This poster is too large to store in the browser. Please choose a smaller image.";
      return;
    }
    saveList(USER_KEY, {
      name: event.organizerName,
      email: event.organizerEmail,
    });
    $scope.success = true;
  };
});

app.controller("CoordinatorController", function ($scope) {
  $scope.form = {};
  $scope.events = approvedEvents();
  $scope.success = false;
  $scope.submit = function () {
    var form = $scope.form;
    var event = eventById(Number(form.eventId));
    if (!event || event.status !== "approved") return;
    var applications = getCoordinatorApplications();
    applications.push({
      id: nextId(applications),
      name: trimmed(form.name),
      email: trimmed(form.email).toLowerCase(),
      enrollment: trimmed(form.enrollment),
      department: trimmed(form.department),
      phone: trimmed(form.phone),
      eventId: event.id,
      eventTitle: event.title,
      message: trimmed(form.message),
      status: "pending",
    });
    saveList(COORDINATOR_KEY, applications);
    $scope.success = true;
  };
});

app.controller("HostController", function ($scope) {
  $scope.user = currentUser();
  $scope.events = [];
  $scope.selectedEvent = null;
  $scope.registrations = [];
  $scope.refresh = function () {
    var email = trimmed($scope.user.email).toLowerCase();
    $scope.registrations = getRegistrations();
    $scope.events = getEvents().filter(function (event) {
      return event.organizerEmail === email;
    });
  };
  $scope.viewRegistrations = function (event) {
    if ($scope.events.indexOf(event) === -1 || event.status !== "approved")
      return;
    $scope.selectedEvent = event;
    $scope.registrations = getRegistrations().filter(function (registration) {
      return Number(registration.eventId) === Number(event.id);
    });
  };
  $scope.backToEvents = function () {
    $scope.selectedEvent = null;
    $scope.registrations = [];
  };
  $scope.refresh();
});

app.controller("AdminController", function ($scope) {
  $scope.loggedIn = false;
  $scope.loginForm = {};
  $scope.loginError = false;
  $scope.login = function () {
    if (
      $scope.loginForm.username === "admin" &&
      $scope.loginForm.password === "admin123"
    ) {
      $scope.loggedIn = true;
      $scope.loginError = false;
      $scope.refresh();
    } else {
      $scope.loginError = true;
    }
  };
  $scope.logout = function () {
    $scope.loggedIn = false;
  };
  $scope.refresh = function () {
    $scope.events = getEvents();
    $scope.pendingEvents = $scope.events.filter(function (event) {
      return event.status === "pending";
    });
    $scope.approvedEvents = $scope.events.filter(function (event) {
      return event.status === "approved";
    });
    $scope.coordinators = getCoordinatorApplications();
    $scope.registrations = getRegistrations();
  };
  $scope.setEventStatus = function (event, status) {
    event.status = status;
    saveList(EVENT_KEY, $scope.events);
    $scope.refresh();
  };
  $scope.setCoordinatorStatus = function (application, status) {
    application.status = status;
    saveList(COORDINATOR_KEY, $scope.coordinators);
    $scope.refresh();
  };
});
