import { game_manager } from "../main.js";

class UIManager{
    constructor(keybinds){
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
        this.keybinds = keybinds;
        this.rebind = {
            active : false,
            action : null,
            key : null
        }
        this.changed_rebind = false;
        this.cheats = {
            on : false,
            kill_aura : false,
            invincibility : false, 
            set_score : null, 
            boosts : {
                smash : null,
                roll : null,
                charge : null
            }
        }
        this.made_choice;
        this.created_end = false;
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
            let response = await fetch(URLS["continue_as_guest"],
                {method : "POST",
                credentials: "same-origin"
                }
            );
            if (response.ok){
                const data = await response.json();
                let ps = document.querySelectorAll("header p");
                ps[0].innerHTML = data.user_id;
                ps[2].firstElementChild.innerHTML = "Logout";
                ps[2].firstElementChild.href = URLS["logout"];
                ps[1].firstElementChild.innerHTML = "Leaderboard";
                ps[1].firstElementChild.href = URLS["leaderboard"];

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
        link.href = URLS[destination];
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
    create_cheats_console(){
        let console = document.createElement("div");
        console.id = "cheats-console";
        let invincibility = this.create_checkbox("invincibility");
        let kill_aura = this.create_checkbox("kill-aura");
        let smash = this.create_multicheckbox_field("smash");
        let roll = this.create_multicheckbox_field("roll");
        let charge = this.create_multicheckbox_field("charge");
        let score = this.create_number_field("score");
        console.appendChild(invincibility);
        console.appendChild(document.createElement("br"));
        console.appendChild(kill_aura);
        console.appendChild(document.createElement("br"));
        console.appendChild(smash);
        console.appendChild(roll);
        console.appendChild(charge);
        console.appendChild(score);
        this.html_overlay.appendChild(console);
    }
    create_number_field(id){
        let label = document.createElement("label");
        let input = document.createElement("input");
        let button = document.createElement("button");
        input.type = "number";
        input.min = "0";
        input.id = id;
        button.id = "button-"+id;
        button.innerHTML = "Apply";
        label.innerHTML = id;
        button.addEventListener("click", () => {
            let value = Number(input.value) || 0;
            if (value > 0) {
                this.cheats.set_score = value;
                this.cheats.on = true;
            }
        });

        label.appendChild(input);
        label.appendChild(button);
        return label;

    }
    create_multicheckbox_field(name){
        let containing_div = document.createElement("div");
        containing_div.id = name+"-container";
        let p = document.createElement("p");
        p.innerHTML = name;
        let label1 = this.create_radio(name,"1");
        let label2 = this.create_radio(name,"2");
        let label3 = this.create_radio(name,"3");
        containing_div.appendChild(p);
        containing_div.appendChild(label1);
        containing_div.appendChild(label2);
        containing_div.appendChild(label3);
        return containing_div;
    }
    create_radio(name,id){
        let label = document.createElement("label");
        let input = document.createElement("input");
        input.type = "radio";
        input.id = name+"-"+id;
        input.name = name;
        input.value = id;
        label.innerHTML = id;
        label.appendChild(input);
        return label;
    }
    create_checkbox(id){
        let label = document.createElement("label");
        let input = document.createElement("input");
        input.type = "checkbox";
        input.id = id;
        label.innerHTML = id;
        label.appendChild(input);
        return label;
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
        this.html_overlay.style.display = "flex";
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
        let rulesButton = this.create_button_with_link("Rules", "rules");
        let creditsButton = this.create_button_with_link("Credits", "credits");
    }
    create_sign_in_screen(){
        game_manager.sfx_manager.play_music("chill_music");

        let p1 = document.querySelector("header p:first-child a");
        if (!(p1.innerHTML==="Leaderboard")){
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
        game_manager.sfx_manager.change_music("game_music");

        this.hide_screen();
    }
    resume_functionality(){
        game_manager.sfx_manager.change_music("game_music");

        this.ready = true;
        this.resume_game();
    }
    create_pause_screen(){
        game_manager.sfx_manager.change_music("chill_music");

        this.reset_screen();
        let resumeButton = this.create_button_with_event_listener("Resume", "resume_functionality");
        let settingsButton = this.create_button_with_event_listener("Settings", "create_settings_screen");
        let cheatsButton = this.create_button_with_event_listener("Cheats", "create_cheats_screen");
        let rulesButton = this.create_button_with_link("Rules", "rules");
        let creditsButton = this.create_button_with_link("Credits", "credits");
    }
    create_keybinds_console(){
        let prettified_keybinds = {
            isAttacking : "Attack",
            moveLeft : "Move Left",
            moveUp : "Move Up",
            moveRight : "Move Right",
            moveDown : "Move Down",
            specialMove : "Special Move",
            specialMoveModifier : "Special Move (Modifier)",
            running : "Pause Game"
        }

        let table = document.createElement("table");
        table.id = "keybinds-table";
        for (let action in this.keybinds){
            let row = document.createElement("tr");
            let header = document.createElement("th");
            row.appendChild(header);

            header.innerHTML = prettified_keybinds[action];
            for (let key of this.keybinds[action]){
                if (key === " "){
                    key = "Space";
                }
                let detail = document.createElement("td");
                let button = document.createElement("button");
                button.innerHTML = key;
                button.onclick = () => this.start_rebind(action,key);
                //button.addEventListener("click", this.start_rebind, {once : true});
                detail.appendChild(button);
                row.appendChild(detail);
            }
            table.appendChild(row);
        }
        return table;

    }
    start_rebind(action,key){
        this.rebind = {
            active : true,
            action : action,
            key : key
        }
        window.addEventListener("keydown", (e) => this.capture_rebind(e), { once: true });
    }
    check_for_duplicate_keybinds(key){
        let duplicate = false; 
        for (let action in this.keybinds){
            for (let set_key of this.keybinds[action]){
                if (set_key === key){
                    duplicate = true;
                }
            }
        }
        if (duplicate === true){ return true;}
        else {return false;}
    }
    capture_rebind(e){
        if (e.key === "Backspace"){return};
        if (this.check_for_duplicate_keybinds(e.key)){return;}
        this.keybinds[this.rebind.action] = [e.key];
        this.rebind = {
            active : false,
            action : null,
            key : null
        }
        this.changed_rebind = true;
        this.create_settings_screen();
        return;

    }
    create_settings_screen(){
        this.reset_screen();
        let goBack = this.create_button_with_event_listener("Go back", "create_pause_screen");
        let music = this.create_checkbox("music");
        
        music.children[0].checked = !game_manager.sfx_manager.music.currently_paused;
        music.children[0].addEventListener("change", () => {
            if (game_manager.sfx_manager.music.currently_paused){
                game_manager.sfx_manager.restart_music();
            }
            else{
                game_manager.sfx_manager.stop_music();

            }

        });

        let table = this.create_keybinds_console();
        this.html_overlay.appendChild(music);
        this.html_overlay.appendChild(table);
        
    }
    create_cheats_screen(){
        this.reset_screen();
        let goBack = this.create_button_with_event_listener("Go back", "create_pause_screen");

        this.create_cheats_console();
        document.getElementById("invincibility").addEventListener("change", e => {
            this.cheats.invincibility = e.target.checked;
            this.cheats.on = true;
        });
        document.getElementById("kill-aura").addEventListener("change", e => {
            this.cheats.kill_aura = e.target.checked;
            this.cheats.on = true;
        });
        this.html_overlay.addEventListener("change", e => {
            if (e.target.matches('input[type="radio"]')) {
                const { name, value } = e.target;
                this.cheats.boosts[name] = Number(value);
                this.cheats.on = true;
            }
        });
    }

    end_game(score){
        if (this.created_end){
            return;
        }
        else{
            this.created_end = true;
            this.create_end_screen(score);
        }
    }
    create_end_screen(score){
        this.created_end = true;
        this.reset_screen();
        this.show_screen();

        let header = document.createElement("h3");
        header.innerHTML = "The End!"
        let text = document.createElement("p");
        text.innerHTML = "You finished with a score of "+score;
        this.html_overlay.appendChild(header);
        this.html_overlay.appendChild(text);
        let restart = this.create_button_with_link("Restart", "index");
        let leaderboard = this.create_button_with_link("See leaderboard", "leaderboard");

    }
    create_choice_screen(ability_manager){
        this.reset_screen();
        this.show_screen();

        let finished_abilities = [];
        for (let ability in ability_manager.current_abilities){
            let ab = ability_manager.current_abilities[ability];
            if (ab && ab !== 0 && ab.level === ab.max_level){
                finished_abilities.push(ability);
            }
        }
        let header = document.createElement("h3");
        header.innerHTML = "You progressed to the next level!"

        let text = document.createElement("p");
        text.innerHTML = "Pick which ability you'd like to upgrade:";

        this.html_overlay.appendChild(header);
        this.html_overlay.appendChild(text);

        let name = "choice";
        for (let ability in ability_manager.current_abilities){
            if (!(finished_abilities.includes(ability))){
                let label = this.create_radio(name,ability);
                this.html_overlay.appendChild(label);
            }
        }
        let button = document.createElement("button");
        button.innerHTML = "Continue";
        this.html_overlay.appendChild(button);

        let result = {}
        this.html_overlay.addEventListener("change", e => {
            if (e.target.matches('input[type="radio"]')) {
                const { name, value } = e.target;
                result = {name : name, value : value};
            }
        });
        button.addEventListener("click", () => {
            this.made_choice = result;
            this.hide_screen();

        });
    }
/*     display_message(message){
        let canvas = document.querySelector("canvas");
        let context = canvas.getContext("2d");

		context.font = "50px Arial";
		context.fillStyle = "black";
		context.fillText("Score: ",canvas.width/3,canvas.height/3);
    }
 */

}

export { UIManager };
