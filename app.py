from flask import Flask, render_template, session, redirect, url_for, g, request
from database import get_db, close_db
from flask_session import Session 
from forms import RegistrationForm, LoginForm
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps


app = Flask(__name__)
app.config["SESSION_PERMANENT"] = False 
app.config["SESSION_TYPE"] = "filesystem"
Session(app)
app.config["SECRET_KEY"] = "this-is-my-secret-key"

app.teardown_appcontext(close_db)

@app.before_request
def load_logged_in_user():
    g.user = session.get("user_id", None)

def login_required(view):
    @wraps(view)
    def wrapped_view(*args, **kwargs):
        if g.user is None:
            return redirect(url_for('login', next=request.url))
        #it will reember where you were and redirect to that place 
        #itll do that by sticking it into the url 
        #when we pull login, the url will say both login and past page
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
            return redirect(url_for('index'))
    return render_template("registration_form.html", form=form)

@app.route("/login", methods=["POST", "GET"])
def login():
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

