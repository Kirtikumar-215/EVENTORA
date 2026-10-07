var app = angular.module('eventoraApp', []);

var EVENT_KEY = 'eventoraEvents';
var REGISTRATION_KEY = 'eventoraRegistrations';
var COORDINATOR_KEY = 'eventoraCoordinatorApplications';

function readList(key, fallback) {
    try {
        var value = JSON.parse(localStorage.getItem(key) || '');
        return Array.isArray(value) ? value : fallback;
    } catch (error) {
        return fallback;
    }
}

function readObject(key, fallback) {
    try {
        var value = JSON.parse(localStorage.getItem(key) || '');
        return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback;
    } catch (error) {
        return fallback;
    }
}

function getEvents() {
    var stored = readList(EVENT_KEY, null);
    if (!stored) {
        stored = eventoraEvents.map(function (event) {
            return angular.extend({ status: 'approved', organizerEmail: '' }, event);
        });
        saveEvents(stored);
    }
    return stored.map(function (event) {
        if (!event.status) event.status = 'approved';
        if (!event.organizerEmail) event.organizerEmail = '';
        return event;
    });
}

function saveEvents(events) { localStorage.setItem(EVENT_KEY, JSON.stringify(events)); }
function getRegistrations() { return readList(REGISTRATION_KEY, []); }
function saveRegistrations(registrations) { localStorage.setItem(REGISTRATION_KEY, JSON.stringify(registrations)); }
function getCoordinatorApplications() { return readList(COORDINATOR_KEY, []); }
function saveCoordinatorApplications(applications) { localStorage.setItem(COORDINATOR_KEY, JSON.stringify(applications)); }
function nextId(items) { return items.reduce(function (max, item) { return Math.max(max, Number(item.id || item.registrationId || 0)); }, 0) + 1; }
function approvedEvents() { return getEvents().filter(function (event) { return event.status === 'approved'; }); }
function inputDate(value) {
    return value instanceof Date ? value.getFullYear() + '-' + String(value.getMonth() + 1).padStart(2, '0') + '-' + String(value.getDate()).padStart(2, '0') : value;
}
function inputTime(value) {
    return value instanceof Date ? String(value.getHours()).padStart(2, '0') + ':' + String(value.getMinutes()).padStart(2, '0') : value;
}

app.controller('HomeController', function ($scope) {
    $scope.events = approvedEvents();
});

app.controller('EventsController', function ($scope) {
    $scope.events = approvedEvents();
});

app.controller('DetailsController', function ($scope) {
    var id = parseInt(new URLSearchParams(location.search).get('id'), 10);
    $scope.event = approvedEvents().find(function (event) { return event.id === id; });
});

app.controller('RegisterController', function ($scope) {
    var id = parseInt(new URLSearchParams(location.search).get('id'), 10);
    $scope.event = approvedEvents().find(function (event) { return event.id === id; });
    $scope.form = {};
    $scope.success = false;
    $scope.register = function () {
        if (!$scope.event) return;
        var registrations = getRegistrations();
        registrations.push({
            registrationId: nextId(registrations),
            eventId: $scope.event.id,
            eventTitle: $scope.event.title,
            studentName: $scope.form.name.trim(),
            email: $scope.form.email.trim(),
            enrollment: $scope.form.enrollment.trim(),
            department: $scope.form.department,
            phone: $scope.form.phone.trim(),
            registrationDate: new Date().toISOString()
        });
        saveRegistrations(registrations);
        $scope.success = true;
    };
});

app.controller('RegistrationsController', function ($scope) {
    $scope.registrations = getRegistrations();
});

app.controller('OrganizeController', function ($scope) {
    $scope.form = {};
    $scope.success = false;
    $scope.submit = function () {
        var events = getEvents();
        var form = $scope.form;
        var event = {
            id: nextId(events),
            title: form.title.trim(),
            category: form.category,
            description: form.description.trim(),
            about: form.description.trim(),
            date: inputDate(form.date),
            time: inputTime(form.time),
            venue: form.venue.trim(),
            organizerName: form.organizerName.trim(),
            organizerEmail: form.organizerEmail.trim().toLowerCase(),
            enrollment: form.enrollment.trim(),
            phone: form.phone.trim(),
            theme: 'theme-tech',
            status: 'pending'
        };
        events.push(event);
        saveEvents(events);
        localStorage.setItem('eventoraCurrentUser', JSON.stringify({ name: event.organizerName, email: event.organizerEmail }));
        $scope.success = true;
    };
});

app.controller('CoordinatorController', function ($scope) {
    $scope.form = {};
    $scope.events = approvedEvents();
    $scope.success = false;
    $scope.submit = function () {
        var applications = getCoordinatorApplications();
        var form = $scope.form;
        applications.push({
            id: nextId(applications),
            name: form.name.trim(),
            email: form.email.trim().toLowerCase(),
            enrollment: form.enrollment.trim(),
            department: form.department,
            phone: form.phone.trim(),
            eventId: Number(form.eventId),
            eventTitle: (getEvents().find(function (event) { return event.id === Number(form.eventId); }) || {}).title || 'Event',
            message: form.message.trim(),
            status: 'pending'
        });
        saveCoordinatorApplications(applications);
        $scope.success = true;
    };
});

app.controller('HostController', function ($scope) {
    $scope.user = readObject('eventoraCurrentUser', {});
    $scope.events = [];
    $scope.selectedEvent = null;
    $scope.registrations = [];
    $scope.findEvents = function () {
        var email = ($scope.email || $scope.user.email || '').trim().toLowerCase();
        $scope.user.email = email;
        $scope.registrations = getRegistrations();
        $scope.events = getEvents().filter(function (event) {
            return event.organizerEmail === email && event.status === 'approved';
        });
        localStorage.setItem('eventoraCurrentUser', JSON.stringify($scope.user));
    };
    $scope.viewRegistrations = function (event) {
        $scope.selectedEvent = event;
        $scope.registrations = getRegistrations().filter(function (registration) { return registration.eventId === event.id; });
    };
    if ($scope.user.email) $scope.findEvents();
});

app.controller('AdminController', function ($scope) {
    $scope.loggedIn = localStorage.getItem('eventoraAdminSession') === 'true';
    $scope.loginForm = {};
    $scope.loginError = false;
    $scope.login = function () {
        if ($scope.loginForm.username === 'admin' && $scope.loginForm.password === 'admin123') {
            localStorage.setItem('eventoraAdminSession', 'true');
            $scope.loggedIn = true;
            $scope.loginError = false;
            $scope.refresh();
        } else {
            $scope.loginError = true;
        }
    };
    $scope.logout = function () {
        localStorage.removeItem('eventoraAdminSession');
        $scope.loggedIn = false;
    };
    $scope.refresh = function () {
        $scope.events = getEvents();
        $scope.pendingEvents = $scope.events.filter(function (event) { return event.status === 'pending'; });
        $scope.approvedEvents = $scope.events.filter(function (event) { return event.status === 'approved'; });
        $scope.coordinators = getCoordinatorApplications();
        $scope.registrations = getRegistrations();
    };
    $scope.setEventStatus = function (event, status) {
        event.status = status;
        saveEvents($scope.events);
        $scope.refresh();
    };
    $scope.setCoordinatorStatus = function (application, status) {
        application.status = status;
        saveCoordinatorApplications($scope.coordinators);
        $scope.refresh();
    };
    if ($scope.loggedIn) $scope.refresh();
});
