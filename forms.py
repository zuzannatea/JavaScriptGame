from flask_wtf import FlaskForm 
from wtforms import RadioField, SubmitField, StringField, PasswordField 
from wtforms.validators import InputRequired, EqualTo

class VoteForm(FlaskForm):
    vote = RadioField("What's your fav number: ", 
                      choices = ["0", "1"], 
                      validators=[InputRequired()])
    submit = SubmitField("Submit: ")

class RegistrationForm(FlaskForm):
    user_id = StringField("User id: ", 
                       validators=[InputRequired()])
    password = PasswordField("Password: ", 
                       validators=[InputRequired()])
    passwordConfirm = PasswordField("Confirm password: ", 
                       validators=[InputRequired(), EqualTo("password")])
    submit = SubmitField("Submit")

class LoginForm(FlaskForm):
    user_id = StringField("User id: ", 
                       validators=[InputRequired()])
    password = PasswordField("Password: ", 
                       validators=[InputRequired()])
    submit = SubmitField("Submit")
