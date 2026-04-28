/**
 * engine.js — Galgame 核心引擎
 * 零依赖，纯原生 ES6+
 * 职责：GameState 管理、Beats 播放器、DOM 渲染、存档/读档、交互控制
 */

/* ==================== BGM 音乐管理器 ==================== */
class BGMManager {
  constructor(bgm_config) {
    this.tracks = new Map();
    this.schedule = [];
    this.current_track_id = null;
    this.current_audio = null;
    this.volume = 0.5;
    this.fade_duration = 1200;

    if (bgm_config) {
      this._init_tracks(bgm_config.tracks || []);
      this._init_schedule(bgm_config.schedule || []);
    }
  }

  _init_tracks(tracks) {
    tracks.forEach(track => {
      const audio = new Audio();
      audio.loop = track.loop !== false;
      audio.preload = 'auto';
      audio.src = track.src;
      this.tracks.set(track.id, { audio, config: track });
    });
  }

  _init_schedule(schedule) {
    this.schedule = schedule.map(entry => ({
      track_id: entry.track,
      from: entry.from,
      until: entry.until || null
    }));
  }

  set_volume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.current_audio) {
      this.current_audio.volume = this.volume;
    }
  }

  on_scene_change(scene_id) {
    const target = this._find_track_for_scene(scene_id);
    if (target !== this.current_track_id) {
      this._crossfade_to(target);
    }
  }

  _find_track_for_scene(scene_id) {
    for (const entry of this.schedule) {
      const match_from = entry.from === scene_id;
      const in_range = entry.from === scene_id;

      if (match_from) return entry.track_id;

      if (this._is_scene_in_range(scene_id, entry.from, entry.until)) {
        return entry.track_id;
      }
    }
    return null;
  }

  _is_scene_in_range(scene_id, from, until) {
    if (!from) return false;
    const scenes = this._get_all_scene_ids_in_order();
    const from_idx = scenes.indexOf(from);
    const current_idx = scenes.indexOf(scene_id);
    if (from_idx === -1 || current_idx === -1) return false;
    if (current_idx < from_idx) return false;
    if (!until) return true;
    const until_idx = scenes.indexOf(until);
    if (until_idx === -1) return true;
    return current_idx < until_idx;
  }

  _get_all_scene_ids_in_order() {
    if (window._game && window._game.scenes) {
      return Object.keys(window._game.scenes);
    }
    return [];
  }

  _crossfade_to(track_id) {
    const prev_audio = this.current_audio;
    const next = track_id ? this.tracks.get(track_id) : null;
    const next_audio = next ? next.audio : null;

    if (prev_audio) {
      this._fade_out(prev_audio, () => {
        prev_audio.pause();
        prev_audio.currentTime = 0;
      });
    }

    if (next_audio) {
      next_audio.currentTime = 0;
      next_audio.volume = 0;
      const play_promise = next_audio.play();
      if (play_promise) {
        play_promise.catch(() => {});
      }
      this._fade_in(next_audio);
    }

    this.current_track_id = track_id;
    this.current_audio = next_audio;
  }

  _fade_in(audio) {
    const steps = 20;
    const step_time = this.fade_duration / steps;
    let step = 0;

    const tick = () => {
      step++;
      const ratio = step / steps;
      audio.volume = this.volume * ratio;
      if (step < steps) {
        setTimeout(tick, step_time);
      } else {
        audio.volume = this.volume;
      }
    };
    tick();
  }

  _fade_out(audio, on_done) {
    const steps = 20;
    const step_time = this.fade_duration / steps;
    let step = 0;
    const start_vol = audio.volume;

    const tick = () => {
      step++;
      const ratio = 1 - step / steps;
      audio.volume = start_vol * ratio;
      if (step < steps) {
        setTimeout(tick, step_time);
      } else {
        audio.volume = 0;
        if (on_done) on_done();
      }
    };
    tick();
  }

  stop() {
    if (this.current_audio) {
      this._fade_out(this.current_audio, () => {
        this.current_audio.pause();
        this.current_audio.currentTime = 0;
      });
      this.current_audio = null;
      this.current_track_id = null;
    }
  }
}

/* ==================== GameState 状态管理 ==================== */
class GameState {
  constructor() {
    this.current_scene = null;
    this.beat_index = 0;
    this.flags = new Set();
    this.affinity = { knight: 50, tian: 50, jackey: 50, mark: 50, coach: 50 };
    this.inventory = new Set();
    this.history = [];
    this.loop_count = 0;
    this.read_scenes = new Set();
  }

  clone() {
    const cloned = new GameState();
    cloned.current_scene = this.current_scene;
    cloned.beat_index = this.beat_index;
    cloned.flags = new Set(this.flags);
    cloned.affinity = { ...this.affinity };
    cloned.inventory = new Set(this.inventory);
    cloned.history = [...this.history];
    cloned.loop_count = this.loop_count;
    cloned.read_scenes = new Set(this.read_scenes);
    return cloned;
  }

  to_json() {
    return JSON.stringify({
      current_scene: this.current_scene,
      beat_index: this.beat_index,
      flags: [...this.flags],
      affinity: this.affinity,
      inventory: [...this.inventory],
      history: this.history,
      loop_count: this.loop_count,
      read_scenes: [...this.read_scenes]
    });
  }

  static from_json(json_str) {
    const data = JSON.parse(json_str);
    const state = new GameState();
    state.current_scene = data.current_scene;
    state.beat_index = data.beat_index || 0;
    state.flags = new Set(data.flags || []);
    state.affinity = data.affinity || { knight: 50, tian: 50, jackey: 50, mark: 50, coach: 50 };
    state.inventory = new Set(data.inventory || []);
    state.history = data.history || [];
    state.loop_count = data.loop_count || 0;
    state.read_scenes = new Set(data.read_scenes || []);
    return state;
  }
}

/* ==================== 角色定义 ==================== */
const CHARACTER_DEFS = {
  wayward: { name: 'Wayward', color: '#00f0ff', abbr: 'Wa' },
  knight: { name: 'Knight', color: '#a855f7', abbr: 'Kn' },
  tian: { name: 'Tian', color: '#22c55e', abbr: 'Ti' },
  jackey: { name: 'JackeyLove', color: '#f59e0b', abbr: 'JL' },
  mark: { name: 'Mark', color: '#64748b', abbr: 'Mk' },
  coach: { name: '白色月牙', color: '#ef4444', abbr: 'BS' },
  qingtian: { name: 'Qingtian', color: '#f97316', abbr: 'QT' }
};


/* ==================== GameEngine 核心引擎 ==================== */
class GameEngine {
  constructor(chapter_data) {
    // 场景数据
    this.scenes = chapter_data.scenes;
    this.start_scene = chapter_data.start_scene || 'ch1_001';
    this.auto_scene = chapter_data.auto_scene || null;

    // 状态
    this.state = new GameState();

    // 播放控制
    this.is_playing = false;
    this.is_auto = false;
    this.is_skip = false;
    this.is_typing = false;
    this.type_timer = null;
    this.auto_timer = null;
    this.cg_timer = null;

    // 设置
    this.settings = {
      text_speed_ms: 30,
      auto_delay_ms: 1800,
      volume: 0.5
    };

    // 当前显示的文本元素缓存
    this._current_full_text = '';
    this._current_char_index = 0;

    // 已显示的选项按钮
    this._choices_displayed = false;

    // DOM 缓存
    this._cache_dom();

    // BGM 管理器
    this.bgm = new BGMManager(chapter_data.bgm || null);
    this.bgm.set_volume(this.settings.volume);

    // 音效上下文
    this._audio_ctx = null;

    // 绑定事件
    this._bind_events();
  }

  /* ========== DOM 缓存 ========== */
  _cache_dom() {
    this.$bg = document.getElementById('bg-layer');
    this.$char_layer = document.getElementById('character-layer');
    this.$cg_layer = document.getElementById('cg-layer');
    this.$cg_darken = document.getElementById('cg-darken');
    this.$cg_text = document.getElementById('cg-overlay-text');
    this.$dialogue = document.getElementById('dialogue-box');
    this.$speaker = document.getElementById('speaker-label');
    this.$text = document.getElementById('text-content');
    this.$choices = document.getElementById('choices-container');
    this.$continue = document.getElementById('continue-indicator');
    this.$ending = document.getElementById('ending-overlay');
    this.$red_pulse = document.getElementById('red-pulse');
    this.$loop_text = document.getElementById('loop-text');
    this.$tv_shutdown = document.getElementById('tv-shutdown');
    this.$tv_line = document.getElementById('tv-white-line');
    this.$tv_snow = document.getElementById('tv-snow');
    this.$history_panel = document.getElementById('history-panel');
    this.$history_list = document.getElementById('history-list');
    this.$save_load_panel = document.getElementById('save-load-panel');
    this.$save_load_title = document.getElementById('save-load-title');
    this.$save_slots = document.getElementById('save-slots');
    this.$settings_panel = document.getElementById('settings-panel');
    this.$affinity_mini = document.getElementById('affinity-mini');
    this.$btn_auto = document.getElementById('btn-auto');
    this.$btn_skip = document.getElementById('btn-skip');
    this.$start_screen = document.getElementById('start-screen');
    this.$btn_start = document.getElementById('btn-start');
  }

  /* ========== 事件绑定 ========== */
  _bind_events() {
    // 推进对话
    this.$dialogue.addEventListener('click', (e) => {
      if (e.target.closest('#choices-container')) return;
      this._advance();
    });

    // CG 层点击也能推进
    this.$cg_layer.addEventListener('click', (e) => {
      if (this.$cg_layer.classList.contains('active') && !this.is_playing) {
        this._advance();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (this.$save_load_panel.classList.contains('active')) return;
        if (this.$settings_panel.classList.contains('active')) return;
        if (this._choices_displayed) return;
        this._advance();
      }
    });

    // 控制栏按钮
    document.getElementById('btn-save').addEventListener('click', () => this._open_save_panel());
    document.getElementById('btn-load').addEventListener('click', () => this._open_load_panel());
    document.getElementById('btn-history').addEventListener('click', () => this._toggle_history());
    document.getElementById('btn-settings').addEventListener('click', () => this._toggle_settings());
    document.getElementById('btn-auto').addEventListener('click', () => this._toggle_auto());
    document.getElementById('btn-skip').addEventListener('click', () => this._toggle_skip());
    document.getElementById('history-close').addEventListener('click', () => this._close_history());
    document.getElementById('save-load-close').addEventListener('click', () => this._close_save_load());
    document.getElementById('settings-close').addEventListener('click', () => this._close_settings());
    document.getElementById('btn-start').addEventListener('click', () => this._start_game());

    // 设置面板滑块
    document.getElementById('setting-speed').addEventListener('input', (e) => {
      this.settings.text_speed_ms = parseInt(e.target.value);
      document.getElementById('setting-speed-val').textContent = e.target.value + 'ms';
    });
    document.getElementById('setting-auto-delay').addEventListener('input', (e) => {
      this.settings.auto_delay_ms = parseInt(e.target.value);
      document.getElementById('setting-auto-delay-val').textContent = e.target.value + 'ms';
    });
    document.getElementById('setting-volume').addEventListener('input', (e) => {
      this.settings.volume = parseInt(e.target.value) / 100;
      document.getElementById('setting-volume-val').textContent = e.target.value + '%';
      if (this.bgm) {
        this.bgm.set_volume(this.settings.volume);
      }
    });
  }

  /* ========== 启动 ========== */
  start() {
    this.state.current_scene = this.start_scene;
    this.state.beat_index = 0;
    this._update_affinity_display();
  }

  /* ========== 开始游戏 ========== */
  _start_game() {
    this.$start_screen.classList.add('hidden');
    setTimeout(() => {
      this.$start_screen.style.display = 'none';
    }, 600);
    this._play_scene(this.start_scene);
  }

  /* ========== 场景播放 ========== */
  _play_scene(scene_id) {
    const scene = this.scenes[scene_id];
    if (!scene) {
      console.error('场景不存在: ' + scene_id);
      return;
    }

    this.state.current_scene = scene_id;
    this.state.beat_index = 0;
    this.state.read_scenes.add(scene_id);
    this._choices_displayed = false;
    this.is_playing = true;

    // 场景BGM切换
    if (this.bgm) {
      this.bgm.on_scene_change(scene_id);
    }

    // 清除当前场景的角色显示
    this._clear_all_chars();
    // 清空对话框文本
    this.$text.textContent = '';
    this.$speaker.classList.remove('visible');
    this.$choices.classList.remove('active');
    this.$choices.innerHTML = '';

    // 开始播放 beats
    this._play_next_beat();
  }

  _play_next_beat() {
    if (!this.is_playing) return;

    // 清除之前的定时器
    this._clear_timers();

    const scene = this.scenes[this.state.current_scene];
    if (!scene) return;

    // 检查是否播放完所有 beats
    if (this.state.beat_index >= scene.beats.length) {
      this._on_beats_finished(scene);
      return;
    }

    const beat = scene.beats[this.state.beat_index];
    this.state.beat_index++;

    this._execute_beat(beat);
  }

  _execute_beat(beat) {
    switch (beat.type) {
      case 'bg':
        this._exec_bg(beat);
        break;
      case 'char':
        this._exec_char(beat);
        break;
      case 'exit':
        this._exec_exit(beat);
        break;
      case 'text':
        this._exec_text(beat);
        break;
      case 'cg':
        this._exec_cg(beat);
        break;
      case 'sfx':
        this._exec_sfx(beat);
        break;
      case 'wait':
        this._exec_wait();
        break;
      default:
        console.warn('未知 beat 类型:', beat.type);
        this._exec_wait();
    }
  }

  /* ========== Beat 执行器 ========== */
  _exec_bg(beat) {
    const asset = beat.asset || 'default';
    const transition = beat.transition || 'fade';

    if (transition === 'cut') {
      this.$bg.classList.add('bg-cut');
    } else {
      this.$bg.classList.remove('bg-cut');
    }

    // 加载真实背景图
    this.$bg.style.backgroundImage = 'url(' + asset + ')';

    // 恢复 transition
    if (transition === 'cut') {
      requestAnimationFrame(() => {
        this.$bg.classList.remove('bg-cut');
      });
    }

    this._exec_wait();
  }

  _exec_char(beat) {
    const char_id = beat.id;
    const pos = beat.pos || 'left';
    const enter = beat.enter || 'fade';
    const def = CHARACTER_DEFS[char_id];
    if (!def) {
      this._exec_wait();
      return;
    }

    // 检查是否已存在同 id 的角色，先移除
    const existing = this.$char_layer.querySelector(`[data-char-id="${char_id}"]`);
    if (existing) {
      existing.remove();
    }

    // 限制最多 2 人同时显示：如果已有 2 个角色，移除最早的
    const current_chars = this.$char_layer.querySelectorAll('.char-sprite:not(.exiting)');
    if (current_chars.length >= 2) {
      const oldest = current_chars[0];
      oldest.classList.add('exit-fade');
      oldest.addEventListener('animationend', () => oldest.remove(), { once: true });
    }

    // 创建立绘占位
    const sprite = document.createElement('div');
    sprite.className = `char-sprite pos-${pos} enter-${enter}`;
    sprite.setAttribute('data-char-id', char_id);
    sprite.style.borderColor = def.color;
    sprite.style.boxShadow = `0 0 20px ${def.color}33, inset 0 0 20px ${def.color}11`;

    // 加载真实立绘
    const img = document.createElement('div');
    img.className = 'char-placeholder';
    img.style.backgroundImage = 'url(assets/chars/' + char_id + '.png)';
    img.style.backgroundSize = 'cover';
    img.style.backgroundPosition = 'center top';
    img.style.border = '2px solid ' + def.color + '66';

    // 名字标签
    const name_tag = document.createElement('div');
    name_tag.className = 'char-name-tag';
    name_tag.textContent = def.name;
    name_tag.style.color = def.color;

    sprite.appendChild(img);
    sprite.appendChild(name_tag);
    this.$char_layer.appendChild(sprite);

    // 触发入场动画
    requestAnimationFrame(() => {
      sprite.classList.add('visible');
    });

    // 标记图片路径
    sprite.setAttribute('data-asset', `assets/chars/${char_id}.png`);

    this._exec_wait();
  }

  _exec_exit(beat) {
    const char_id = beat.id;
    const exit = beat.exit || 'fade';
    const sprite = this.$char_layer.querySelector(`[data-char-id="${char_id}"]`);
    if (sprite) {
      sprite.classList.remove('visible');
      sprite.classList.add(`exit-${exit}`);
      sprite.classList.add('exiting');
      sprite.addEventListener('animationend', () => sprite.remove(), { once: true });
    }
    this._exec_wait();
  }

  _exec_text(beat) {
    const content = beat.content || '';
    const speaker = beat.speaker || null;

    // 更新 speaker 标签
    if (speaker) {
      const def = CHARACTER_DEFS[speaker];
      this.$speaker.textContent = def ? def.name : speaker;
      this.$speaker.style.borderLeftColor = def ? def.color : '#888';
      this.$speaker.classList.add('visible');
    } else {
      this.$speaker.classList.remove('visible');
      this.$speaker.textContent = '';
    }

    // 添加到历史
    this.state.history.push({ speaker: speaker, text: content });
    this._update_history_panel();

    // 打字机效果
    this._type_text(content, () => {
      // 打字完成后，在 Auto 或 Skip 模式下自动推进
      if (this.is_skip) {
        this._advance();
      } else if (this.is_auto) {
        this.auto_timer = setTimeout(() => this._advance(), this.settings.auto_delay_ms);
      }
    });
  }

  _exec_cg(beat) {
    const asset = beat.asset || '';
    const overlay = beat.overlay || null;
    const duration = beat.duration || 0;
    const transition = beat.transition || 'fade';
    const darken = beat.darken || false;

    // 清除之前的 CG 定时器
    if (this.cg_timer) {
      clearTimeout(this.cg_timer);
      this.cg_timer = null;
    }

    // 加载真实 CG 图
    this.$cg_layer.style.backgroundImage = 'url(' + asset + ')';
    this.$cg_layer.setAttribute('data-asset', asset);

    // 暗角遮罩
    if (darken) {
      this.$cg_darken.classList.add('active');
    } else {
      this.$cg_darken.classList.remove('active');
    }

    // overlay 文字
    if (overlay) {
      this.$cg_text.textContent = overlay;
      this.$cg_text.classList.add('active');
    } else {
      this.$cg_text.classList.remove('active');
      this.$cg_text.textContent = '';
    }

    // 显示 CG
    this.$cg_layer.classList.add('active');
    this.$cg_layer.classList.remove('fade-out');
    this.$cg_layer.classList.add('fade-in');

    if (duration === 0) {
      // 等待点击
      this.$continue.classList.add('visible');
      this.is_playing = false; // 暂停等点击
    } else {
      // 自动延时淡出
      this.cg_timer = setTimeout(() => {
        this._hide_cg();
      }, duration);
      this._exec_wait();
    }
  }

  _hide_cg() {
    this.$cg_layer.classList.remove('fade-in');
    this.$cg_layer.classList.add('fade-out');

    const on_done = () => {
      this.$cg_layer.classList.remove('active', 'fade-out');
      this.$cg_darken.classList.remove('active');
      this.$cg_text.classList.remove('active');
      this.$cg_text.textContent = '';
      this.$cg_layer.removeEventListener('animationend', on_done);
    };
    this.$cg_layer.addEventListener('animationend', on_done, { once: true });
  }

  _exec_sfx(beat) {
    // Web Audio API 合成短促 beep
    try {
      if (!this._audio_ctx) {
        this._audio_ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = this._audio_ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(this.settings.volume * 0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      // 静默忽略音频错误
    }
    this._exec_wait();
  }

  _exec_wait() {
    // 如果不是 skip 模式，显示继续指示器并等待点击
    if (this.is_skip) {
      this._advance();
      return;
    }

    this.$continue.classList.add('visible');

    // 如果正在显示 CG (duration=0)，不自动推进
    if (this.$cg_layer.classList.contains('active')) {
      return;
    }

    if (this.is_auto) {
      this.auto_timer = setTimeout(() => this._advance(), this.settings.auto_delay_ms);
    }
  }

  /* ========== 打字机效果 ========== */
  _type_text(full_text, on_done) {
    this._clear_timers();
    this.is_typing = true;
    this._current_full_text = full_text;
    this._current_char_index = 0;
    this.$text.textContent = '';
    this.$continue.classList.remove('visible');

    const type_next = () => {
      if (this._current_char_index < full_text.length) {
        this.$text.textContent += full_text[this._current_char_index];
        this._current_char_index++;
        this.$text.scrollTop = this.$text.scrollHeight;
        this.type_timer = setTimeout(type_next, this.settings.text_speed_ms);
      } else {
        this.is_typing = false;
        this.$continue.classList.add('visible');
        if (on_done) on_done();
      }
    };

    type_next();
  }

  _skip_typing() {
    if (this.is_typing) {
      this._clear_timers();
      this.$text.textContent = this._current_full_text;
      this.$text.scrollTop = this.$text.scrollHeight;
      this._current_char_index = this._current_full_text.length;
      this.is_typing = false;
      this.$continue.classList.add('visible');
    }
  }

  /* ========== Beats 播完处理 ========== */
  _on_beats_finished(scene) {
    // 检查是否是结局场景
    if (scene.isEnding) {
      this._start_ending();
      return;
    }

    // 显示选项
    if (scene.choices && scene.choices.length > 0) {
      this._show_choices(scene.choices);
    } else if (scene.next) {
      // 无选项，自动跳转
      this._play_scene(scene.next);
    } else if (scene.next_scene) {
      this._play_scene(scene.next_scene);
    }
  }

  /* ========== 选项系统 ========== */
  _show_choices(choices) {
    this._choices_displayed = true;
    this.$choices.innerHTML = '';
    this.$continue.classList.remove('visible');

    choices.forEach((choice, index) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = choice.text;

      // 检查条件
      let condition_met = true;
      if (choice.condition) {
        try {
          condition_met = choice.condition(this.state);
        } catch (e) {
          console.error('条件判断出错:', e);
          condition_met = false;
        }
      }

      if (!condition_met) {
        btn.classList.add('disabled');
      } else {
        btn.addEventListener('click', () => this._on_choice_selected(choice, btn));
      }

      this.$choices.appendChild(btn);
    });

    this.$choices.classList.add('active');

    // 自动存档（选择前的状态）
    this._auto_save();
  }

  _on_choice_selected(choice, btn) {
    // 禁用所有按钮
    this.$choices.querySelectorAll('.choice-btn').forEach(b => {
      b.disabled = true;
      b.style.pointerEvents = 'none';
    });

    // 选中动画
    btn.style.transform = 'translateX(4px) translateY(2px)';
    btn.style.boxShadow = '0 0 16px rgba(255,255,255,0.3)';
    btn.style.background = 'rgba(255,255,255,0.22)';

    // 执行 effect
    if (choice.effect) {
      try {
        choice.effect(this.state);
      } catch (e) {
        console.error('effect 执行出错:', e);
      }
    }

    // 更新好感度显示
    this._update_affinity_display();

    // 自动存档
    this._auto_save();

    // 确定跳转目标
    const target = choice.next;

    // 延迟跳转
    setTimeout(() => {
      this.$choices.classList.remove('active');
      this.$choices.innerHTML = '';
      this._choices_displayed = false;
      this._clear_all_chars();
      if (target) {
        this._play_scene(target);
      }
    }, 400);
  }

  /* ========== 推进对话 ========== */
  _advance() {
    // 如果 CG 正在显示（duration=0 的点击等待模式），隐藏 CG 后继续
    if (this.$cg_layer.classList.contains('active') && !this.is_playing) {
      this.is_playing = true;
      this.$continue.classList.remove('visible');
      this._hide_cg();
      setTimeout(() => this._play_next_beat(), 650);
      return;
    }

    // 如果有选项显示，不处理
    if (this._choices_displayed) return;

    // 如果正在打字，跳过动画
    if (this.is_typing) {
      this._skip_typing();
      return;
    }

    if (!this.is_playing) {
      this.is_playing = true;
      this._play_next_beat();
      return;
    }

    this._play_next_beat();
  }

  /* ========== CG 点击处理 ========== */
  _handle_cg_click() {
    if (this.$cg_layer.classList.contains('active') && !this.is_playing) {
      this.is_playing = true;
      this.$continue.classList.remove('visible');
      // CG duration=0 模式下的点击处理已在 _advance 中
    }
  }

  /* ========== 坏结局动画 ========== */
  _start_ending() {
    this.is_playing = false;
    this._clear_timers();
    const loop = this.state.loop_count + 1;

    // 1. 全屏红色脉冲 3 次
    this.$ending.classList.add('active');
    this.$red_pulse.classList.add('pulse');

    // 2. 显示循环文字
    setTimeout(() => {
      this.$loop_text.innerHTML = `时间重置...<br>Loop ${loop}`;
      this.$loop_text.classList.add('visible');
    }, 1400);

    // 3. 电视关机动画
    setTimeout(() => {
      this.$loop_text.classList.remove('visible');
      this.$tv_shutdown.classList.add('active');
      this.$tv_line.classList.add('shrink');

      setTimeout(() => {
        this.$tv_snow.classList.add('active');
      }, 700);
    }, 3200);

    // 4. 重置状态并重开
    setTimeout(() => {
      this.state.loop_count = loop;
      this.state.beat_index = 0;
      // 保留 affinity 和 flags

      // 隐藏结局动画
      this.$ending.classList.remove('active');
      this.$red_pulse.classList.remove('pulse');
      this.$tv_shutdown.classList.remove('active');
      this.$tv_line.classList.remove('shrink');
      this.$tv_snow.classList.remove('active');

      // 重新开始
      this._play_scene(this.start_scene);
    }, 4800);
  }

  /* ========== Auto / Skip 模式 ========== */
  _toggle_auto() {
    this.is_auto = !this.is_auto;
    this.is_skip = false;
    this.$btn_auto.classList.toggle('active', this.is_auto);
    this.$btn_skip.classList.remove('active');

    if (this.is_auto && !this.is_typing && this.is_playing) {
      this.auto_timer = setTimeout(() => this._advance(), this.settings.auto_delay_ms);
    } else if (!this.is_auto) {
      this._clear_auto_timer();
    }
  }

  _toggle_skip() {
    this.is_skip = !this.is_skip;
    this.is_auto = false;
    this.$btn_skip.classList.toggle('active', this.is_skip);
    this.$btn_auto.classList.remove('active');
    this._clear_auto_timer();

    if (this.is_skip) {
      // 快速推进
      if (this.is_typing) {
        this._skip_typing();
      }
      if (this.is_playing) {
        this._advance();
      }
    }
  }

  /* ========== 历史日志 ========== */
  _toggle_history() {
    const is_open = this.$history_panel.classList.contains('open');
    if (is_open) {
      this._close_history();
    } else {
      this._update_history_panel();
      this.$history_panel.classList.add('open');
    }
  }

  _close_history() {
    this.$history_panel.classList.remove('open');
  }

  _update_history_panel() {
    this.$history_list.innerHTML = '';
    const entries = this.state.history;
    const start = Math.max(0, entries.length - 50);

    for (let i = start; i < entries.length; i++) {
      const entry = entries[i];
      const div = document.createElement('div');
      div.className = 'history-entry';

      if (entry.speaker) {
        const def = CHARACTER_DEFS[entry.speaker];
        const sp_name = def ? def.name : entry.speaker;
        const sp_color = def ? def.color : '#888';
        const sp = document.createElement('div');
        sp.className = 'h-speaker';
        sp.style.color = sp_color;
        sp.style.borderLeft = `3px solid ${sp_color}`;
        sp.style.paddingLeft = '8px';
        sp.textContent = sp_name;
        div.appendChild(sp);
      }

      const txt = document.createElement('div');
      txt.className = 'h-text';
      txt.textContent = entry.text;
      div.appendChild(txt);

      this.$history_list.appendChild(div);
    }

    this.$history_list.scrollTop = this.$history_list.scrollHeight;
  }

  /* ========== 存档 / 读档 ========== */
  _auto_save() {
    const json = this.state.to_json();
    localStorage.setItem('galgame_autosave', json);
  }

  _save_to_slot(slot_index) {
    const json = this.state.to_json();
    const key = `galgame_save_${slot_index}`;
    localStorage.setItem(key, json);

    const scene = this.scenes[this.state.current_scene];
    const scene_name = scene ? scene.name || this.state.current_scene : this.state.current_scene;
    const time = new Date().toLocaleString('zh-CN');
    const meta = JSON.stringify({ scene_name, time });
    localStorage.setItem(key + '_meta', meta);

    this._render_save_slots();
  }

  _load_from_slot(slot_index) {
    const key = `galgame_save_${slot_index}`;
    const json = localStorage.getItem(key);
    if (!json) return;

    this.state = GameState.from_json(json);

    this._close_save_load();
    this._clear_all_chars();
    this.$cg_layer.classList.remove('active');
    this.$cg_darken.classList.remove('active');
    this.$cg_text.classList.remove('active');
    this.$choices.classList.remove('active');
    this.$choices.innerHTML = '';
    this._choices_displayed = false;
    this.is_auto = false;
    this.is_skip = false;
    this.$btn_auto.classList.remove('active');
    this.$btn_skip.classList.remove('active');
    this._update_affinity_display();
    this._update_history_panel();

    // 恢复场景
    this.is_playing = true;
    // 重新开始当前场景
    this._play_scene_restore();
  }

  _play_scene_restore() {
    // 快速播放到 beat_index 的位置（跳过已播 beats 的视觉效果）
    const scene = this.scenes[this.state.current_scene];
    if (!scene) return;

    const saved_index = this.state.beat_index;
    this._choices_displayed = false;

    // 快速执行前面的 bg 和 char beats 来恢复视觉状态
    for (let i = 0; i < saved_index; i++) {
      const beat = scene.beats[i];
      if (beat.type === 'bg') {
        this.$bg.style.backgroundImage = 'url(' + beat.asset + ')';
      } else if (beat.type === 'char') {
        this._restore_char(beat);
      } else if (beat.type === 'exit') {
        const sprite = this.$char_layer.querySelector(`[data-char-id="${beat.id}"]`);
        if (sprite) sprite.remove();
      }
    }

    // 恢复历史记录中的 text beats
    for (let i = 0; i < saved_index; i++) {
      const beat = scene.beats[i];
      if (beat.type === 'text') {
        const found = this.state.history.find(h => h.text === beat.content);
        if (!found) {
          this.state.history.push({ speaker: beat.speaker || null, text: beat.content });
        }
      }
    }

    // 设置正确的 beat_index，继续播放
    this.state.beat_index = saved_index;
    this.is_playing = true;
    this._play_next_beat();
  }

  _restore_char(beat) {
    const char_id = beat.id;
    const pos = beat.pos || 'left';
    const def = CHARACTER_DEFS[char_id];
    if (!def) return;

    const existing = this.$char_layer.querySelector(`[data-char-id="${char_id}"]`);
    if (existing) return;

    const sprite = document.createElement('div');
    sprite.className = `char-sprite pos-${pos} visible`;
    sprite.setAttribute('data-char-id', char_id);
    sprite.style.borderColor = def.color;
    sprite.style.boxShadow = `0 0 20px ${def.color}33, inset 0 0 20px ${def.color}11`;

    const img = document.createElement('div');
    img.className = 'char-placeholder';
    img.style.backgroundImage = 'url(assets/chars/' + char_id + '.png)';
    img.style.backgroundSize = 'cover';
    img.style.backgroundPosition = 'center top';
    img.style.border = '2px solid ' + def.color + '66';

    const name_tag = document.createElement('div');
    name_tag.className = 'char-name-tag';
    name_tag.textContent = def.name;
    name_tag.style.color = def.color;

    sprite.appendChild(img);
    sprite.appendChild(name_tag);
    sprite.setAttribute('data-asset', `assets/chars/${char_id}.png`);
    this.$char_layer.appendChild(sprite);
  }

  _open_save_panel() {
    this.$save_load_title.textContent = '存档';
    this._render_save_slots();
    this.$save_load_panel.classList.add('active');
  }

  _open_load_panel() {
    this.$save_load_title.textContent = '读档';
    this._render_save_slots();
    this.$save_load_panel.classList.add('active');
  }

  _close_save_load() {
    this.$save_load_panel.classList.remove('active');
  }

  _render_save_slots() {
    this.$save_slots.innerHTML = '';
    const is_save = this.$save_load_title.textContent === '存档';

    for (let i = 0; i < 3; i++) {
      const key = `galgame_save_${i}`;
      const meta_key = key + '_meta';
      const json = localStorage.getItem(key);
      const meta_str = localStorage.getItem(meta_key);
      let meta = null;
      try { meta = meta_str ? JSON.parse(meta_str) : null; } catch (e) {}

      const slot = document.createElement('div');
      slot.className = 'save-slot';

      const info = document.createElement('div');
      if (json && meta) {
        info.innerHTML = `<strong>存档槽 ${i + 1}</strong><br><span class="slot-info">${meta.scene_name || '???'} | ${meta.time || '???'}</span>`;
      } else {
        info.innerHTML = `<strong>存档槽 ${i + 1}</strong><br><span class="slot-info">空</span>`;
      }

      const actions = document.createElement('div');
      actions.className = 'save-slot-actions';

      if (is_save) {
        const save_btn = document.createElement('button');
        save_btn.className = 'save-slot-btn';
        save_btn.textContent = '保存';
        save_btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this._save_to_slot(i);
        });
        actions.appendChild(save_btn);
      }

      if (json) {
        const load_btn = document.createElement('button');
        load_btn.className = 'save-slot-btn';
        load_btn.textContent = '读取';
        load_btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this._load_from_slot(i);
        });
        actions.appendChild(load_btn);
      }

      slot.appendChild(info);
      slot.appendChild(actions);
      this.$save_slots.appendChild(slot);
    }
  }

  /* ========== 设置面板 ========== */
  _toggle_settings() {
    const is_active = this.$settings_panel.classList.contains('active');
    if (is_active) {
      this._close_settings();
    } else {
      this.$settings_panel.classList.add('active');
    }
  }

  _close_settings() {
    this.$settings_panel.classList.remove('active');
  }

  /* ========== 好感度显示 ========== */
  _update_affinity_display() {
    this.$affinity_mini.innerHTML = '';
    const chars = ['knight', 'tian', 'jackey', 'mark', 'coach'];

    chars.forEach(id => {
      const def = CHARACTER_DEFS[id];
      const value = this.state.affinity[id] || 0;
      const pct = Math.min(100, Math.max(0, value));

      const item = document.createElement('div');
      item.className = 'affinity-item';

      const abbr = document.createElement('div');
      abbr.className = 'affinity-abbr';
      abbr.textContent = def.abbr;
      abbr.style.color = def.color;

      const bar_bg = document.createElement('div');
      bar_bg.className = 'affinity-bar-bg';

      const bar_fill = document.createElement('div');
      bar_fill.className = 'affinity-bar-fill';
      bar_fill.style.width = pct + '%';
      bar_fill.style.background = def.color;

      const tooltip = document.createElement('div');
      tooltip.className = 'affinity-tooltip';
      tooltip.textContent = `${def.name}: ${value}`;

      bar_bg.appendChild(bar_fill);
      item.appendChild(abbr);
      item.appendChild(bar_bg);
      item.appendChild(tooltip);
      this.$affinity_mini.appendChild(item);
    });
  }

  /* ========== 清理 ========== */
  _clear_all_chars() {
    while (this.$char_layer.firstChild) {
      this.$char_layer.firstChild.remove();
    }
  }

  _clear_timers() {
    if (this.type_timer) {
      clearTimeout(this.type_timer);
      this.type_timer = null;
    }
    if (this.auto_timer) {
      clearTimeout(this.auto_timer);
      this.auto_timer = null;
    }
  }

  _clear_auto_timer() {
    if (this.auto_timer) {
      clearTimeout(this.auto_timer);
      this.auto_timer = null;
    }
  }

  /* ========== 测试运行器 ========== */
  /** 遍历所有场景 choices，验证 next 存在、condition 不抛错、无孤立节点 */
  test_runner() {
    const errors = [];
    const visited = new Set();
    const scene_ids = Object.keys(this.scenes);

    // BFS 遍历所有可达场景
    const queue = [this.start_scene];

    while (queue.length > 0) {
      const sid = queue.shift();
      if (visited.has(sid)) continue;
      visited.add(sid);

      const scene = this.scenes[sid];
      if (!scene) {
        errors.push(`场景 "${sid}" 不存在`);
        continue;
      }

      // 检查自动跳转
      if (scene.next) {
        if (!this.scenes[scene.next]) {
          errors.push(`场景 "${sid}" 的 next="${scene.next}" 不存在`);
        }
        queue.push(scene.next);
      }
      if (scene.next_scene) {
        if (!this.scenes[scene.next_scene]) {
          errors.push(`场景 "${sid}" 的 next_scene="${scene.next_scene}" 不存在`);
        }
        queue.push(scene.next_scene);
      }

      // 检查选项
      if (scene.choices) {
        scene.choices.forEach((choice, idx) => {
          if (choice.next && !this.scenes[choice.next] && !choice.next.startsWith('ch1_bad') && !choice.next.startsWith('ch1_good')) {
            errors.push(`场景 "${sid}" 选项[${idx}] next="${choice.next}" 场景不存在`);
          }
          if (choice.next) {
            queue.push(choice.next);
          }

          // 测试 condition 不抛错
          if (choice.condition) {
            try {
              const test_state = new GameState();
              choice.condition(test_state);
            } catch (e) {
              errors.push(`场景 "${sid}" 选项[${idx}] condition 抛出异常: ${e.message}`);
            }
          }
        });
      }
    }

    // 检查孤立节点
    scene_ids.forEach(sid => {
      if (!visited.has(sid)) {
        errors.push(`警告: 场景 "${sid}" 从 start_scene 不可达（可能是孤立节点）`);
      }
    });

    // 检查 bad/good 结局引用
    scene_ids.forEach(sid => {
      const scene = this.scenes[sid];
      if (scene.choices) {
        scene.choices.forEach((choice, idx) => {
          if (choice.next) {
            if ((choice.next.startsWith('ch1_bad_') || choice.next.startsWith('ch1_good_')) && !this.scenes[choice.next]) {
              errors.push(`场景 "${sid}" 选项[${idx}] 引用了不存在的结局 "${choice.next}"`);
            }
          }
        });
      }
    });

    if (errors.length === 0) {
      return { ok: true, message: `验证通过: ${visited.size} 个场景可达, 共 ${scene_ids.length} 个场景` };
    }
    return { ok: false, errors };
  }
}

/**
 * 全局测试入口 —— 在浏览器控制台中调用 test_runner() 即可
 * 或直接在 data-ch1.js 加载后自动运行
 */
function test_runner() {
  if (window._game) {
    return window._game.test_runner();
  }
  return { ok: false, errors: ['GameEngine 未初始化'] };
}
