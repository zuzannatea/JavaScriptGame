class UIManager{
    constructor(){
        this.ui_states = {
            0 : "start_screen",
            1 : "sign_in_screen",
            2 : "press_start_screen",
            3 : "game_screen",
            4 : "pause_screen",
            5 : "end_screen"
        }
        this.max_ui_state_index = 5;
        this.current_ui_state_index = 0;
        this.html_overlay = document.getElementById("html-overlay");
        this.create_start_screen();
        this.ready = false;
    }
    progress(){
        if (this.current_ui_state_index != this.max_ui_state_index){
            this.current_ui_state_index = this.current_ui_state_index + 1;
        }
        this.reset_screen();
        this["create_"+this.ui_states[this.current_ui_state_index]]();
        if (this.current_ui_state_index === 3){
            this.ready = true;
        }
        return;
    }
    async continue_as_guest(){
        try {
            let response = await fetch("/continue_as_guest",
                {method : "POST",
                credentials: "same-origin"
                }
            );
            console.log(response);
            if (response.ok){
                const data = await response.json();
                let p1 = document.querySelector("header p:first-child");
                let p2_a = document.querySelector("header p:last-child a");
                p1.innerHTML = data.user_id;
                p2_a.innerHTML = "Logout";
                p2_a.href = "{{ url_for('logout') }}";

                this.progress();
                return true;
            }
            else{
                return false; 
            }
        }
        catch{
            return false;
        }
        
    }

    create_button_with_link(caption,destination){
        let button = document.createElement("button");
        let link = document.createElement("a");
        link.href = "/"+destination;
        link.innerHTML = caption;
        this.html_overlay.appendChild(button);
        button.appendChild(link);
        return button;

    }
    create_button_with_event_listener(caption,func){
        let button = document.createElement("button");
        this.html_overlay.appendChild(button);
        button.innerHTML = caption;
        button.addEventListener("click", () => this[func]());
        return button;

    }
    reset_screen(){
        while (this.html_overlay.hasChildNodes()) {
            this.html_overlay.removeChild(this.html_overlay.firstChild);
        }
    }
    hide_screen(){
        this.html_overlay.style.display = "none";
    }
    show_screen(){
        this.html_overlay.style.display = "block";
    }
    pause_game(){
        this.show_screen();
        this.create_pause_screen();
        return;
    }
    resume_game(){
        this.reset_screen();
        this.hide_screen();
    }
    create_start_screen(){
        let startButton = this.create_button_with_event_listener("Start", "progress");
        let rulesButton = this.create_button_with_link("Rules", "login");
        let creditsButton = this.create_button_with_link("Credits", "login");
    }
    create_sign_in_screen(){
        let p1 = document.querySelector("header p:first-child a");
        if (!p1){
            this.progress();
            return;
        }
        let signInButton = this.create_button_with_link("Sign In", "register");
        let continueAsGuestButton = this.create_button_with_event_listener("Continue as Guest", "continue_as_guest");
    }
    create_press_start_screen(){
        let signInButton = this.create_button_with_event_listener("Play", "progress");
    }
    create_game_screen(){
        this.hide_screen();
    }
    create_pause_screen(){
        let signInButton = this.create_button_with_event_listener("Play", "progress");
    }
    
    create_end_screen(){

    }

}

export { UIManager };
