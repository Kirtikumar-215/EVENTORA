EVENTORA LITE
Simple college event discovery and registration.

STACK: HTML, CSS, Bootstrap, JavaScript, AngularJS, basic PHP.
DATABASE: NONE.
Registration is stored in browser localStorage.

FEATURES:
- Organize an Event: organize-event.html (proposals start as pending).
- Admin Panel: admin.html (approve or reject event and coordinator requests).
- Become a Coordinator: coordinator.html.
- My Hosted Events: host.html (organizers use the email submitted with their event).

ADMIN DEMO:
Username: admin
Password: admin123

DATA:
Events, registrations, coordinator applications, and demo sessions are stored
in localStorage keys beginning with eventora. There is no database.

RUN:
1. Extract the ZIP.
2. Open Command Prompt in the Eventora-Lite folder.
3. With XAMPP PHP:
   C:\xampp\php\php.exe -S localhost:8000
4. Open http://localhost:8000/

Or, if PHP is in PATH:
   php -S localhost:8000

You can also open index.html directly, but the PHP server command is recommended.
