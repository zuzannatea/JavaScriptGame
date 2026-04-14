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
    }
    progress(){
        if (this.current_ui_state_index != this.max_ui_state_index){
            this.current_ui_state_index = this.current_ui_state_index + 1;
        }
        this.remove_screen();
        this["create_"+this.ui_states[this.current_ui_state_index]]();

    }

    create_button_with_link(caption,destination){
        let button = document.createElement("button");
        let link = document.createElement("a");
        link.href = "{{ url_for('{" + destination + "}') }}";
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
    remove_screen(){
        while (this.html_overlay.hasChildNodes()) {
            this.html_overlay.removeChild(this.html_overlay.firstChild);
        }
    }
    create_start_screen(){
        let startButton = this.create_button_with_event_listener("Start", "progress");
        let rulesButton = this.create_button_with_link("Rules", "login");
        let creditsButton = this.create_button_with_link("Credits", "login");
    }
    create_sign_in_screen(){

    }
    create_press_start_screen(){

    }
    create_game_screen(){

    }
    create_pause_screen(){

    }
    create_end_screen(){

    }
}

export { UIManager };
