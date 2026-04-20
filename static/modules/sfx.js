import { load_assets } from "./utils.js";

function blank(){};
class SFXManager{
    constructor(){
        this.music = {
            chill_music : new Audio(),
            game_music : new Audio(),
            currently_playing : null
        }
        this.sounds = {
            player_damage : new Audio(),
            player_death : new Audio(),
            player_charging : new Audio(),
            player_dash : new Audio(),
            splitting_sound : new Audio(),
            boost_collect_sound : new Audio(),
            level_up_sound : new Audio()
        }
        load_assets([
            {"var" : this.music.chill_music, "url" : "static/assets/music/GoblinsDenRegular.wav"},
            {"var" : this.music.game_music, "url" : "static/assets/music/GoblinsDenBattle.wav"},

            {"var" : this.sounds.boost_collect_sound, "url" : "static/assets/music/boost_collect_sound.mp3"},
            {"var" : this.sounds.level_up_sound, "url" : "static/assets/music/level_up_sound.mp3"},
            {"var" : this.sounds.splitting_sound, "url" : "static/assets/music/splitting_sound.mp3"},

            {"var" : this.sounds.player_dash, "url" : "static/assets/music/player_dash.wav"},
            {"var" : this.sounds.player_death, "url" : "static/assets/music/player_death.wav"},
            {"var" : this.sounds.player_damage, "url" : "static/assets/music/player_damage.wav"},
            {"var" : this.sounds.player_charging, "url" : "static/assets/music/player_charging.wav"},

        ], blank);

    }
    
    play_sound(sound){
        if (this.sounds[sound]){
            this.sounds[sound].play();
        }

    }
    loop_sound(sound){
        if (this.sounds[sound]){
            this.sounds[sound].loop = true;
            this.sounds[sound].play();
        }
    }
    unloop_sound(sound){
        if (this.sounds[sound]){
            this.sounds[sound].loop = false;
            this.sounds[sound].pause();
        }

    }
    play_music(){
        console.log("Playing");
        console.log(this);
        this.music.chill_music.loop = true;
        this.music.chill_music.play();
        this.music.currently_playing = this.music.chill_music;
    }
    change_music(type){
        this.music.currently_playing.pause();
        this.music[type].loop = true;
        this.music[type].play();
        this.music.currently_playing = this.music[type];
    }
    stop_music(){
        this.music.currently_playing.pause();
    }
    restart_music(){
        this.music.currently_playing.play();

    }

}

export {SFXManager}