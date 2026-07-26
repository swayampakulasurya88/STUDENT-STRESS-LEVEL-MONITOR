Calm Compass - Program Files
=============================

IMPORTANT - please read this first
-----------------------------------
This website is a single-page, front-end-only application. There is no
separate server/backend program (like a Node.js, PHP, or Python server)
running anywhere - everything runs inside the user's browser, and all data
(students, teachers, assessments, etc.) is saved in the browser's own local
storage on each device.

So there isn't literally a "backend program" to hand over. What this zip
does instead is split the one big HTML file into the two halves that best
match what people usually mean by "frontend" and "backend":

1) FRONTEND (what the user sees and interacts with)
   - index.html   -> Page structure/markup (all screens: login, student
                      view, teacher view, admin view, etc.)
   - styles.css   -> All visual styling/design (colors, layout, animations)

2) "BACKEND" / DATA + LOGIC LAYER (runs in-browser, acts like a backend)
   - app.js       -> All the application logic: the Store object (reads/
                     writes data to the browser's localStorage, which is
                     standing in for a real database), user authentication,
                     scoring/assessment logic, admin CRUD operations
                     (add/edit/delete students & teachers), report
                     generation, audit logging, backup/restore, etc.
                     This is the closest thing this app has to a "backend" -
                     it's the part that manages data and business rules,
                     it just runs client-side instead of on a server.

How to run it
--------------
Just open index.html in a browser. All three files (index.html, styles.css,
app.js) must stay in the same folder together, since index.html links to
the other two by relative filename.

If you actually want a REAL backend
-------------------------------------
If you want real user accounts, a shared database, and data that persists
across devices/browsers (instead of being stuck in one browser's local
storage), that requires building an actual server-side backend (e.g. with
Node.js + Express + a database like PostgreSQL/MongoDB, or a
backend-as-a-service like Firebase/Supabase). That's a separate build - just
say the word and I can help design and build that too.

Fix included in this version
------------------------------
Same modal fix as before: Add/Edit Student and Add/Edit Teacher no longer
open greyed-out and unclickable. See app.js for the two
"document.body.appendChild(...)" lines that resolve it (search for
"studentModal" / "teacherModal").
