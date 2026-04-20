from flask import Flask, render_template, jsonify, session, redirect, url_for, g, request
from database import get_db, close_db
from flask_session import Session 
from forms import RegistrationForm, LoginForm
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from random import randint


app = Flask(__name__)
app.config["SESSION_PERMANENT"] = False 
app.config["SESSION_TYPE"] = "filesystem"
Session(app)
app.config["SECRET_KEY"] = "this-is-my-secret-key"

app.teardown_appcontext(close_db)

@app.before_request
def load_logged_in_user():
    g.user = session.get("user_id", None)
    g.is_guest = session.get("is_guest",None)

def login_required(view):
    @wraps(view)
    def wrapped_view(*args, **kwargs):
        if g.user is None:
            return redirect(url_for('login', next=request.url))
        return view(*args, **kwargs)
    return wrapped_view

@app.route("/")
def index():
    return render_template("main.html")


@app.route("/register", methods=["POST", "GET"])
def register():
    form = RegistrationForm()
    if form.validate_on_submit():
        user_id = form.user_id.data 
        password = form.password.data 
        db = get_db()
        conflict = db.execute("""SELECT * FROM users
                    WHERE user_id == ?;""", (user_id,)).fetchone()
        if conflict:
            form.user_id.errors.append("That user id is taken")
        else:
            db.execute(
                """INSERT INTO users (user_id,password)
                VALUES (?, ?);
                """, (user_id,generate_password_hash(password)) )
            db.commit()
            session.clear()
            session["user_id"] = user_id 
            session["is_guest"] = False 
            next_page = request.args.get("next")
            if not next_page:
                next_page = url_for("index")
            return redirect(next_page)

    return render_template("registration_form.html", form=form)

@app.route("/login", methods=["POST", "GET"])
def login():
    if g.user:
        next_page = request.args.get("next")
        if not next_page:
            next_page = url_for("index")
        return redirect(next_page)

    form = LoginForm()
    if form.validate_on_submit():
        user_id = form.user_id.data 
        password = form.password.data 
        db = get_db()
        matching_user = db.execute("""SELECT * FROM users
                    WHERE user_id == ?;""", (user_id,)).fetchone()
        if matching_user is None:
            form.user_id.errors.append("That user id does not exist")
        elif not check_password_hash(matching_user["password"], password):
            form.password.errors.append("Password is incorrect")
        else:
            session.clear()
            session["user_id"] = user_id 
            session["is_guest"] = False 
            next_page = request.args.get("next")
            if not next_page:
                next_page = url_for("index")
            return redirect(next_page)
    return render_template("login_form.html", form=form)

@app.route("/logout", methods=["POST", "GET"])
@login_required
def logout():
    session.clear() 
    return redirect(url_for('index'))

@app.route("/continue_as_guest", methods=["POST"])
def continue_as_guest():
    db = get_db()
    user_id = "guest"+str(randint(100,999))
    password = str(randint(100,999))
    conflict = db.execute("""SELECT * FROM users
                    WHERE user_id == ?;""", (user_id,)).fetchone()
    while conflict:
        user_id = "guest"+str(randint(100,999))
        conflict = db.execute("""SELECT * FROM users
                    WHERE user_id == ?;""", (user_id,)).fetchone()
    db.execute(
        """INSERT INTO users (user_id,password,is_guest)
        VALUES(?,?,?);""", (user_id,generate_password_hash(password),1)
    )
    db.commit()
    session.clear()
    session["user_id"] = user_id
    session["is_guest"] = True 
    """ next_page = request.args.get("next")
    if not next_page:
        next_page = url_for("index")
    return redirect(next_page) """
    return jsonify({'status' : 'success',
                    'user_id' : user_id})


@app.route("/store_result", methods=["POST"])
def store_result():
    score = int(request.form["score"])
    db = get_db()
    try:
        db.execute("""INSERT INTO past_games(user_id, score, cheats_used)
            VALUES(?, ?, ?); """,
            (g.user, score, True))
        db.commit()
        return "Success"
    except:
        return "Failure"

@app.route("/leaderboard", methods=["POST", "GET"])
def leaderboard():
    db = get_db()
    results = db.execute("""SELECT user_id,score
                        FROM past_games 
                        ORDER BY score DESC 
                        LIMIT 10;""").fetchall()
    return render_template("leaderboard.html", results=results)

@app.route("/profile", methods=["POST","GET"])
@login_required
def profile():
    db = get_db()
    results = db.execute("""SELECT user_id,score
                        FROM past_games
                        WHERE user_id = ?
                        ORDER BY score DESC;""", (g.user,)).fetchall()
    return render_template("profile.html", results=results)

@app.route("/rules", methods=["POST","GET"])
def rules():
    return render_template("rules.html")

@app.route("/credits", methods=["POST","GET"])
def credits():
    return render_template("credits.html")
