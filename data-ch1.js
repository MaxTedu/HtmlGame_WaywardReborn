/**
 * data-ch1.js — 第一章场景数据（基于 S12 真实历史重构 + 修改内容.md）
 *
 * 时间：2022年10月16日，纽约，S12 小组赛第二轮 C 组车轮战
 * 赛程同一天：04:00 GAM vs TES → 07:00 TES vs RGE → 08:00 TES vs DRX
 * 战绩背景：第一轮 TES 1-2（赢GAM、输RGE、输DRX）
 *
 * 真实阵容：
 *   TES：Wayward鳄鱼 / Tian男枪 / Knight阿狸 / JackeyLove卢锡安 / Mark娜美
 *   GAM：Kiaya奥恩 / Levi死歌 / Kati瑟提 / Sty1e卡莉斯塔 / Bie烈娜塔
 *
 * 场景结构：{ id, name?, beats: Array, choices?: Array, next?, isEnding? }
 * effect 必须是纯函数，直接修改 state，防御 undefined
 */

const CHAPTER1_DATA = {
  start_scene: 'ch1_001',
  auto_scene: null,

  /**
   * BGM 音乐配置
   *
   * tracks:  定义所有可用曲目
   *   - id:    曲目唯一标识（ schedule 中引用）
   *   - src:   音频文件路径
   *   - loop:  是否循环播放（默认 true）
   *
   * schedule: 定义播放计划（按顺序匹配，优先级从上到下）
   *   - track:  要播放的曲目 id，设为 null 可静音
   *   - from:   从哪个场景「开始」播放（包含该场景）
   *   - until:  到哪个场景「之前」停止（不包含该场景）
   *            设为 null 表示一直播放到章节末尾
   *
   * 示例：下面表示 ch1_001 ~ ch1_005（不含）播放 opening，
   *       ch1_005 及之后播放 match
   */
  bgm: {
    tracks: [
      {
        id: 'opening',
        src: 'assets/bgm/水月陵 - 死者の嘆き-开头平淡.mp3',
        loop: true
      },
      {
        id: 'match',
        src: 'assets/bgm/Sebastien Najand,英雄联盟 - Camille, the Steel Shadow-比赛开始过程.mp3',
        loop: true
      }
    ],
    schedule: [
      // 第一段：从 ch1_001 酒店房间开始，到 ch1_005 之前结束
      { track: 'opening', from: 'ch1_001', until: 'ch1_009' },

      // 第二段：从 ch1_005 开始，一直播放到章节结束
      { track: 'match', from: 'ch1_009', until: null }
    ]
  },

  scenes: {

    /* ========== ch1_001 酒店·凌晨 ========== */
    ch1_001: {
      name: '酒店房间·凌晨',
      beats: [
        { type: 'bg', asset: 'assets/bg/dorm.jpg', transition: 'fade' },
        {
          type: 'text', speaker: null,
          content: '2022年10月16日。凌晨三点。纽约某酒店房间里，我猛地睁开眼睛。'
        },
        {
          type: 'text', speaker: 'wayward',
          content: '我超……这是……S12 小组赛第二轮？！C 组车轮战日？！'
        },
        {
          type: 'text', speaker: null,
          content: '手机上的日期刺眼地亮着——October 16。今天连打三场：四点 GAM，七点 RGE，八点 DRX。上一轮我们 1-2，只赢了 GAM，输了 RGE 和 DRX。'
        },
        {
          type: 'text', speaker: 'wayward',
          content: '他妈的……历史里今天第一场就输 GAM。被反一波。然后全网喷我们"输越南"。十六强回家。'
        },
        {
          type: 'text', speaker: 'wayward',
          content: '既然让我重来一次，至少今天不能再输越南。'
        },
        { type: 'char', id: 'knight', pos: 'left', enter: 'fade' },
        {
          type: 'text', speaker: 'knight',
          content: 'Wayward……你也醒了？'
        },
        {
          type: 'text', speaker: 'knight',
          content: '我睡不着。今天三场全胜才有理论可能……但 DRX 的 Zeka，他塞拉斯太猛了……第一轮我们打 DRX 那把，中路被压了四十刀……'
        },
        {
          type: 'text', speaker: 'knight',
          content: '我又开始手抖了……我怕又像去年四强那样，一到关键局就崩。'
        },
        {
          type: 'text', speaker: 'wayward',
          content: '（Knight 还是老样子。但这次我知道他会遇到什么——至少今天第一场打 GAM，我能帮他稳住。）'
        }
      ],
      choices: [
        {
          text: '「Knight，信我，今天先从 GAM 开刀。」（安慰）',
          next: 'ch1_002',
          effect: (s) => { s.affinity.knight = (s.affinity.knight || 0) + 3; }
        },
        {
          text: '「睡不着就聊聊，反正四点就打 GAM 了。」（闲聊）',
          next: 'ch1_003'
        },
        {
          text: '翻了个身，假装没听见。',
          next: 'ch1_004'
        }
      ]
    },

    /* ========== ch1_002 走廊·安慰线 ========== */
    ch1_002: {
      name: '走廊·安慰线',
      beats: [
        { type: 'bg', asset: 'assets/bg/hallway.jpg', transition: 'fade' },
        { type: 'char', id: 'wayward', pos: 'right', enter: 'slide' },
        { type: 'char', id: 'knight', pos: 'left', enter: 'fade' },
        {
          type: 'text', speaker: 'wayward',
          content: '走，出去透透气。'
        },
        {
          type: 'text', speaker: null,
          content: '走廊里昏暗安静。远处隐约传来麦迪逊广场花园的夜灯。Knight 跟在后面，脚步声很轻。'
        },
        {
          type: 'text', speaker: 'knight',
          content: '第一轮打 RGE 那把我太拉了……下路被压了八十刀。打 DRX 更离谱，Zeka 的塞拉斯单杀了我两次……'
        },
        {
          type: 'text', speaker: 'wayward',
          content: '那些都是上一轮的事了。今天不一样。GAM 这把我们稳吃。Levi 的死歌我来想办法。'
        },
        {
          type: 'text', speaker: 'knight',
          content: '你真有把握？'
        },
        {
          type: 'text', speaker: 'wayward',
          content: '如何呢？我什么时候骗过你。'
        },
        {
          type: 'text', speaker: null,
          content: 'Knight 的眼神稍微亮了一点。虽然只是一点点，但至少他没在抖了。'
        }
      ],
      choices: [
        {
          text: '「走，去训练室找 Tian 碰一下。」',
          next: 'ch1_005'
        }
      ]
    },

    /* ========== ch1_003 走廊·闲聊线 ========== */
    ch1_003: {
      name: '走廊·闲聊线',
      beats: [
        { type: 'bg', asset: 'assets/bg/hallway.jpg', transition: 'fade' },
        { type: 'char', id: 'wayward', pos: 'right', enter: 'slide' },
        { type: 'char', id: 'knight', pos: 'left', enter: 'fade' },
        {
          type: 'text', speaker: 'wayward',
          content: '睡不着了，走，出去看看。'
        },
        { type: 'char', id: 'tian', pos: 'right', enter: 'slide' },
        { type: 'exit', id: 'wayward', exit: 'fade' },
        { type: 'char', id: 'wayward', pos: 'center', enter: 'fade' },
        { type: 'char', id: 'jackey', pos: 'right', enter: 'slide' },
        { type: 'exit', id: 'tian', exit: 'fade' },
        {
          type: 'text', speaker: 'jackey',
          content: '哟，都醒了？正好！今天三场——四点打外卡，七点打 RGE，八点打 DRX。杀穿就完事了！'
        },
        {
          type: 'text', speaker: 'tian',
          content: '你轻点。Levi 死歌不好搞。'
        },
        {
          type: 'text', speaker: 'jackey',
          content: '死歌怎么了？我卢锡安加娜美，他 R 还没读完我已经把他下路杀了。'
        },
        { type: 'char', id: 'mark', pos: 'right', enter: 'slide' },
        { type: 'exit', id: 'jackey', exit: 'fade' },
        {
          type: 'text', speaker: 'mark',
          content: '哎你们知道吗？我六岁那年第一次玩 LOL，用的就是死歌。那时候我才发现这英雄全图大太赖了……所以我觉得 Levi 可能真的很猛……'
        },
        {
          type: 'text', speaker: 'tian',
          content: 'Mark 你在扯什么淡。'
        },
        {
          type: 'text', speaker: 'wayward',
          content: '（走廊上的气氛倒是没那么紧张了。但 Tian 的表情告诉我，他对 Levi 的死歌是真的忌惮。）'
        }
      ],
      choices: [
        {
          text: '「Tian，今天帮我蹲上，我压 Kiaya。」（认真说服）',
          next: 'ch1_005',
          effect: (s) => { s.flags.add('tian_gank_top'); s.affinity.tian = (s.affinity.tian || 0) + 2; }
        },
        {
          text: '「随缘打吧，相信个人能力。」',
          next: 'ch1_006'
        }
      ]
    },

    /* ========== ch1_004 装睡线 ========== */
    ch1_004: {
      name: '酒店·天亮',
      beats: [
        { type: 'bg', asset: 'assets/bg/dorm.jpg', transition: 'cut' },
        {
          type: 'text', speaker: 'wayward',
          content: '（我翻了个身，假装睡着了。Knight 叹口气，没再说话。）'
        },
        {
          type: 'text', speaker: null,
          content: '不知过了多久，门被推开了。'
        },
        { type: 'char', id: 'coach', pos: 'center', enter: 'fade' },
        {
          type: 'text', speaker: 'coach',
          content: 'Wayward！四点就打 GAM了！全队都在等你一个人！'
        },
        { type: 'char', id: 'mark', pos: 'right', enter: 'slide' },
        {
          type: 'text', speaker: 'mark',
          content: '教练……Wayward 可能昨晚没睡好……哎我上次没睡好还是我六岁那年，那会儿我刚上小学一年级……'
        },
        {
          type: 'text', speaker: 'coach',
          content: 'Mark 你在扯什么！Wayward，起来，今天不是来旅游的！'
        },
        {
          type: 'text', speaker: 'wayward',
          content: '（白色月牙的脸涨得通红。Mark 在旁边讪笑。）'
        }
      ],
      choices: [
        {
          text: '「对不起教练，我昨晚在研究 GAM 录像。」（认错）',
          next: 'ch1_007',
          effect: (s) => { s.affinity.coach = (s.affinity.coach || 0) + 1; }
        },
        {
          text: '「急什么，外卡而已。」（顶嘴）',
          next: 'ch1_008',
          effect: (s) => { s.affinity.coach = (s.affinity.coach || 0) - 3; s.affinity.jackey = (s.affinity.jackey || 0) + 1; }
        }
      ]
    },

    /* ========== ch1_005 训练室·Tian 路线 ========== */
    ch1_005: {
      name: '训练室·Tian 路线',
      beats: [
        { type: 'bg', asset: 'assets/bg/training.jpg', transition: 'fade' },
        { type: 'char', id: 'wayward', pos: 'left', enter: 'fade' },
        { type: 'char', id: 'tian', pos: 'right', enter: 'slide' },
        {
          type: 'text', speaker: 'wayward',
          content: 'Tian，今天上路怎么说？Kiaya 奥恩好抓，但 Levi 死歌反蹲很危险。'
        },
        {
          type: 'text', speaker: 'tian',
          content: '我知道。但我男枪前期刷野比他死歌快。你压线，我反蹲，他来了我们二打二不怕。'
        },
        {
          type: 'text', speaker: 'wayward',
          content: '我跟你讲，Levi 的刷野路线我研究过了——他蓝开必去下。你三级直接来上，肯定抓得到。'
        },
        {
          type: 'text', speaker: 'tian',
          content: '你什么时候这么认真研究对面了？行吧，信你一次。'
        },
        {
          type: 'text', speaker: null,
          content: 'Tian 难得松了口。虽然他还是那副面无表情的样子，但眼神是认真的。'
        },
        { type: 'char', id: 'coach', pos: 'center', enter: 'fade' },
        { type: 'exit', id: 'tian', exit: 'fade' },
        {
          type: 'text', speaker: 'coach',
          content: '走了！进场了！别磨蹭！'
        }
      ],
      next: 'ch1_007'
    },

    /* ========== ch1_006 训练室·散场 ========== */
    ch1_006: {
      name: '训练室·散场',
      beats: [
        { type: 'bg', asset: 'assets/bg/training.jpg', transition: 'fade' },
        { type: 'char', id: 'wayward', pos: 'center', enter: 'fade' },
        { type: 'char', id: 'tian', pos: 'right', enter: 'slide' },
        {
          type: 'text', speaker: 'tian',
          content: '随缘？那我刷野也随缘了。'
        },
        {
          type: 'text', speaker: 'jackey',
          content: '怕什么，我卢锡安杀穿。'
        },
        {
          type: 'text', speaker: 'wayward',
          content: '（虽然没说服 Tian 来帮上，但至少气氛没炸。大家都在，心态还行。）'
        },
        { type: 'char', id: 'coach', pos: 'center', enter: 'fade' },
        { type: 'exit', id: 'tian', exit: 'fade' },
        { type: 'exit', id: 'wayward', exit: 'fade' },
        {
          type: 'text', speaker: 'coach',
          content: '走了！进场了！今天三场，给我打起精神！'
        }
      ],
      next: 'ch1_007'
    },

    /* ========== ch1_007 赛场进场（所有人汇合） ========== */
    ch1_007: {
      name: '赛场·进场',
      beats: [
        { type: 'bg', asset: 'assets/bg/backstage.jpg', transition: 'fade' },
        { type: 'char', id: 'wayward', pos: 'center', enter: 'fade' },
        {
          type: 'text', speaker: 'wayward',
          content: '（通道昏暗而漫长。五个人站在一起，脚步声在走廊里回荡。）'
        },
        { type: 'exit', id: 'wayward', exit: 'fade' },
        { type: 'char', id: 'coach', pos: 'center', enter: 'fade' },
        {
          type: 'text', speaker: 'coach',
          content: '今天三场。第一场 GAM，必须赢。后面 RGE 和 DRX，一场都不能输。听明白没有？'
        },
        { type: 'exit', id: 'coach', exit: 'fade' },
        { type: 'char', id: 'knight', pos: 'left', enter: 'slide' },
        { type: 'char', id: 'tian', pos: 'right', enter: 'slide' },
        {
          type: 'text', speaker: 'tian',
          content: '明白。'
        },
        {
          type: 'text', speaker: 'knight',
          content: '嗯。'
        },
        { type: 'exit', id: 'knight', exit: 'fade' },
        { type: 'exit', id: 'tian', exit: 'fade' },
        { type: 'char', id: 'jackey', pos: 'right', enter: 'slide' },
        {
          type: 'text', speaker: 'jackey',
          content: '杀穿就完事了！走！'
        },
        { type: 'char', id: 'mark', pos: 'left', enter: 'slide' },
        {
          type: 'text', speaker: 'mark',
          content: '说真的兄弟们，我六岁那年第一次上赛场都没这么紧张……算了不说了，冲！'
        },
        { type: 'exit', id: 'jackey', exit: 'fade' },
        { type: 'exit', id: 'mark', exit: 'fade' },
        { type: 'char', id: 'coach', pos: 'center', enter: 'fade' },
        {
          type: 'text', speaker: 'coach',
          content: 'TES！记住今天的战术执行！纪律性！鳄鱼压线，男枪控资源，阿狸游走，下路卢娜打出优势！'
        },
        {
          type: 'cg', asset: 'assets/cg/team_s12_group.jpg', overlay: 'TES S12 · 纽约', darken: true, duration: 0
        },
        {
          type: 'text', speaker: null,
          content: '（五个人穿过走廊，走向舞台。灯光越来越亮，观众的喧嚣声涌来。比赛开始了。）'
        }
      ],
      next: 'ch1_009'
    },

    /* ========== ch1_008 顶嘴线 ========== */
    ch1_008: {
      name: '酒店·冲突',
      beats: [
        { type: 'bg', asset: 'assets/bg/dorm.jpg', transition: 'cut' },
        { type: 'char', id: 'coach', pos: 'center', enter: 'fade' },
        {
          type: 'text', speaker: 'coach',
          content: '——啪！'
        },
        {
          type: 'text', speaker: null,
          content: '白色月牙把战术本摔在床上。'
        },
        {
          type: 'text', speaker: 'coach',
          content: 'Wayward！你什么态度？！外卡？外卡也是世界赛的队伍！你昨晚训练赛打成什么样自己没数？'
        },
        {
          type: 'text', speaker: 'wayward',
          content: '我只是说没必要这么紧张……BP 随便打打就赢了。'
        },
        {
          type: 'text', speaker: 'coach',
          content: '随便？行！今天 BP 你自己来！我看你怎么"随便"赢！'
        },
        { type: 'char', id: 'mark', pos: 'right', enter: 'slide' },
        {
          type: 'text', speaker: 'mark',
          content: '那个……Wayward，你不该顶撞教练的。哎不过话说回来，我六岁那年顶撞我班主任……后来……算了不说了。'
        },
        {
          type: 'text', speaker: 'wayward',
          content: '（白色月牙怒气冲冲地走了。Mark 耸耸肩跟了上去。）'
        }
      ],
      next: 'ch1_009'
    },

    /* ========== ch1_009 BP 席（核心场景） ========== */
    ch1_009: {
      name: '比赛·BP 席',
      beats: [
        { type: 'bg', asset: 'assets/bg/stage.jpg', transition: 'fade' },
        {
          type: 'text', speaker: null,
          content: '舞台的灯光照得人睁不开眼。五台电脑并排摆开，屏幕泛着幽蓝色的光。观众席传来隐约的欢呼和议论声。'
        },
        {
          type: 'text', speaker: 'coach',
          content: '第一场 GAM。Wayward，上路你想拿什么？'
        },
        {
          type: 'text', speaker: 'jackey',
          content: '给我卢锡安，我下路杀穿。Mark 拿娜美。'
        },
        {
          type: 'text', speaker: 'mark',
          content: '我没问题。但是教练，对面烈娜塔加卡莉斯塔……我们下路不太好打对线。'
        },
        {
          type: 'text', speaker: 'tian',
          content: '我男枪。Levi 死歌……要不要 ban？'
        },
        {
          type: 'text', speaker: 'coach',
          content: '死歌确实是个问题。所有队打 GAM 都 ban 了。Wayward，你怎么看？'
        },
        {
          type: 'text', speaker: 'wayward',
          content: '（白色月牙把决定权交给了我。JackeyLove 在右边不耐烦地敲键盘，Tian 抱着手臂等我说话。BP 倒计时一秒一秒地走着。）'
        }
      ],
      choices: [
        {
          text: '「教练，ban 死歌。Levi 这英雄不能放。」',
          next: 'ch1_010',
          effect: (s) => { s.flags.add('ban_karthus'); s.affinity.coach = (s.affinity.coach || 0) + 1; s.affinity.mark = (s.affinity.mark || 0) + 2; }
        },
        {
          text: '「拿鳄鱼，我对线压 Kiaya。」（历史阵容）',
          next: 'ch1_010',
          effect: (s) => { s.flags.add('picked_croc'); }
        },
        {
          text: '「拿纳尔吧，稳一点。」',
          next: 'ch1_010',
          effect: (s) => { s.flags.add('picked_gnar'); s.affinity.coach = (s.affinity.coach || 0) - 1; s.affinity.jackey = (s.affinity.jackey || 0) - 1; }
        },
        {
          text: '（BP 席上争吵不休，各执一词……）',
          next: 'ch1_bad_02',
          condition: (s) => (s.affinity.jackey || 0) < 30 && (s.affinity.coach || 0) < 30
        }
      ]
    },

    /* ========== ch1_010 比赛·前期 ========== */
    ch1_010: {
      name: '比赛·前期',
      beats: [
        { type: 'bg', asset: 'assets/bg/game_hud.jpg', transition: 'cut' },
        {
          type: 'text', speaker: null,
          content: '【04:00 · TES vs GAM · 比赛开始】'
        },
        {
          type: 'text', speaker: null,
          content: '【第六分钟。Tian 男枪抓中，Knight 阿狸闪现 E 命中 Kati 瑟提——一血！TES 率先打开局面。】'
        },
        { type: 'cg', asset: 'assets/cg/match_blood_first.jpg', overlay: 'First Blood · TES', darken: true, duration: 0 },
        {
          type: 'text', speaker: 'wayward',
          content: '奈斯 Knight！'
        },
        {
          type: 'text', speaker: null,
          content: '【第十二分钟。下路 3v2，GAM 打野 Levi 蹲草，Mark 娜美走位靠前被烈娜塔 Q 中——Mark 阵亡。JackeyLove 交闪逃生。】'
        },
        {
          type: 'text', speaker: 'wayward',
          content: '（和历史一样……下路还是被抓了。但这次不同，我们还有机会。）'
        },
        {
          type: 'text', speaker: null,
          content: '【第十九分钟。Tian 男枪抓上，Wayward 鳄鱼闪现 W 定住 Kiaya 奥恩——击杀！上路优势建立。】'
        },
        {
          type: 'text', speaker: 'wayward',
          content: '（但 Levi 的死歌在野区发育得很好……他冰杖已经快做出来了。）'
        }
      ],
      choices: [
        {
          text: '继续压上路线，给 Kiaya 压力。',
          next: 'ch1_011'
        },
        {
          text: '回撤守塔，稳一点。',
          next: 'ch1_011'
        }
      ]
    },

    /* ========== ch1_011 比赛·中期小龙团 ========== */
    ch1_011: {
      name: '比赛·中期小龙团',
      beats: [
        { type: 'bg', asset: 'assets/bg/game_hud.jpg', transition: 'cut' },
        {
          type: 'text', speaker: null,
          content: '【第二十七分钟。小龙团。GAM 土龙魂听牌，TES 必须接这波团。】'
        },
        { type: 'cg', asset: 'assets/cg/match_dragon_standoff.jpg', overlay: '土龙魂 · 听牌', darken: true, duration: 0 },
        {
          type: 'text', speaker: null,
          content: '【Kiaya 奥恩在龙坑上方开大——羊来了！Kati 瑟提从侧面抱人进场！JackeyLove 被抱到！】'
        },
        {
          type: 'text', speaker: null,
          content: '【但最要命的是——Levi 在龙坑后面找到了完美位置。他的大招已经锁定了 TES 全员。】'
        },
        { type: 'cg', asset: 'assets/cg/match_karthus_r.jpg', overlay: 'Levi 死歌 · 湮灭', darken: true, duration: 0 },
        {
          type: 'text', speaker: 'wayward',
          content: '他妈的！Levi 要在后面放大！'
        },
        {
          type: 'text', speaker: 'tian',
          content: '我在龙坑，没法打断他。你鳄鱼能不能 E 穿墙过去？'
        },
        {
          type: 'text', speaker: 'wayward',
          content: '（死歌如果放出大招，全员残血，这波团根本没法打。但如果我离场去找他，正面就少了一个前排……）'
        }
      ],
      choices: [
        {
          text: '找死歌打断 R！',
          next: 'ch1_012',
          condition: (s) => s.flags.has('tian_gank_top'),
          effect: (s) => { s.flags.add('stopped_karthus_r'); s.affinity.tian = (s.affinity.tian || 0) + 2; }
        },
        {
          text: '「来不及了！跟团先打正面！」',
          next: 'ch1_012',
          effect: (s) => { s.flags.add('karthus_ult_went_off'); }
        }
      ]
    },

    /* ========== ch1_012 比赛·远古龙 ========== */
    ch1_012: {
      name: '比赛·远古龙',
      beats: [
        { type: 'bg', asset: 'assets/bg/game_hud.jpg', transition: 'cut' },
        {
          type: 'text', speaker: null,
          content: '【第三十八分钟。远古龙团。GAM 已经 1 换 3，正在打远古龙。TES 只剩 JackeyLove 和 Tian 还活着。】'
        },
        {
          type: 'text', speaker: 'jackey',
          content: '我上了！远古龙不能放！'
        },
        {
          type: 'text', speaker: 'tian',
          content: '别——'
        },
        {
          type: 'text', speaker: null,
          content: '【JackeyLove 卢锡安 E 上龙坑——惩戒！抢到了！！！远古龙到手！】'
        },
        { type: 'cg', asset: 'assets/cg/match_elder_steal.jpg', overlay: '远古龙 · 抢到！', darken: true, duration: 0 },
        {
          type: 'text', speaker: null,
          content: '【Knight 阿狸复活赶到！魅惑命中！三杀！TES 团灭 GAM！】'
        },
        { type: 'cg', asset: 'assets/cg/match_ace.jpg', overlay: 'ACE · 团灭', darken: true, duration: 0 },
        {
          type: 'text', speaker: 'jackey',
          content: '一波一波！直接拆！他们复活还有四十秒！'
        },
        {
          type: 'text', speaker: 'tian',
          content: '稳一点。拿龙撤退。他们复活时间很长但死歌还有 TP。'
        },
        {
          type: 'text', speaker: 'mark',
          content: '我……我没大招了兄弟们。不过话说回来我六岁那年玩死歌，TP 绕后这种事我干过好多次……'
        },
        {
          type: 'text', speaker: 'wayward',
          content: '（所有人都在等我做决定。历史里我们选择了一波——然后被反一波。但这次……）'
        }
      ],
      choices: [
        {
          text: '「一波！拆家！」（历史选择）',
          next: 'ch1_013',
          effect: (s) => { s.flags.add('chose_to_push'); s.affinity.jackey = (s.affinity.jackey || 0) + 2; }
        },
        {
          text: '「拿龙撤退，稳一点。」（正确选择）',
          next: 'ch1_014',
          effect: (s) => { s.flags.add('chose_to_retreat'); s.affinity.coach = (s.affinity.coach || 0) + 3; s.affinity.tian = (s.affinity.tian || 0) + 2; s.affinity.mark = (s.affinity.mark || 0) + 2; }
        }
      ]
    },

    /* ========== ch1_013 比赛·拆家 ========== */
    ch1_013: {
      name: '比赛·拆家',
      beats: [
        { type: 'bg', asset: 'assets/bg/game_hud.jpg', transition: 'cut' },
        { type: 'cg', asset: 'assets/cg/match_base_push.jpg', overlay: 'GAM 基地 · 最后一搏', darken: true, duration: 0 },
        {
          type: 'text', speaker: null,
          content: '【TES 带着远古龙 Buff 直奔 GAM 基地。两座门牙塔已掉。GAM 的基地岌岌可危。】'
        },
        {
          type: 'text', speaker: null,
          content: '【但 Kiaya 奥恩复活了！他用大招清兵线！Sty1e 的卡莉斯塔在泉水门口插矛！】'
        },
        {
          type: 'text', speaker: 'jackey',
          content: '点基地点基地！别管人！'
        },
        {
          type: 'text', speaker: 'tian',
          content: '奥恩在前面扛着，打不动。'
        },
        {
          type: 'text', speaker: null,
          content: '【Knight 阿狸和 JackeyLove 卢锡安在扛塔输出。死歌的复活倒计时还剩十秒。基地还差最后一下——但瑟提复活了！】'
        },
        {
          type: 'text', speaker: 'wayward',
          content: '（历史里……我在这里选择了扛塔。结果被奥恩控住，死歌复活唱 R，瑟提抱人——被反一波。这次——）'
        }
      ],
      choices: [
        {
          text: '鳄鱼顶前面扛塔，让队友全力输出！（历史失误）',
          next: 'ch1_bad_01',
          effect: (s) => { s.flags.add('tanked_tower_mistake'); }
        },
        {
          text: '「Jackey，你卢锡安手长你点基地。我绕后拦复活的人。」（正确）',
          next: 'ch1_014',
          effect: (s) => { s.flags.add('flanked_revivers'); s.affinity.jackey = (s.affinity.jackey || 0) + 2; s.affinity.tian = (s.affinity.tian || 0) + 2; }
        }
      ]
    },

    /* ========== ch1_014 比赛·胜利 ========== */
    ch1_014: {
      name: '比赛·胜利',
      beats: [
        { type: 'bg', asset: 'assets/bg/stage.jpg', transition: 'fade' },
        {
          type: 'text', speaker: null,
          content: '【GAM 基地爆炸！TES 拿下第一场！】'
        },
        { type: 'cg', asset: 'assets/cg/match_victory.jpg', overlay: 'VICTORY · 首胜', darken: true, duration: 0 },
        {
          type: 'text', speaker: 'jackey',
          content: 'Nice！！！我就说杀穿吧！'
        },
        {
          type: 'text', speaker: 'tian',
          content: '打得好。'
        },
        {
          type: 'text', speaker: 'knight',
          content: '赢了……我们真的赢了。'
        },
        {
          type: 'text', speaker: 'wayward',
          content: '（至少……没有输越南。）'
        },
        { type: 'char', id: 'coach', pos: 'center', enter: 'fade' },
        {
          type: 'text', speaker: 'coach',
          content: '别高兴太早。战绩 2-2。但 DRX 刚才赢了 RGE。'
        },
        {
          type: 'text', speaker: null,
          content: '休息室的空气忽然安静了下来。'
        },
        {
          type: 'text', speaker: 'coach',
          content: '后面还有 RGE 和 DRX 两场。输一场就可能 3-3，要看别人脸色。必须两场全赢才能 4-2 出线。'
        },
        {
          type: 'text', speaker: null,
          content: '赢了 GAM，打破了"输越南"的魔咒。但真正的考验——是后面两场。命运的齿轮还在转动。'
        },
        {
          type: 'text', speaker: null,
          content: '【第一章 · 未完待续】'
        },
        { type: 'wait' }
      ],
      choices: [
        {
          text: '【第一章完 · 回到起点】',
          next: 'ch1_001'
        }
      ]
    },

    /* ========== ch1_bad_01 历史线·输 GAM ========== */
    ch1_bad_01: {
      name: '坏结局：历史重演',
      isEnding: true,
      beats: [
        { type: 'bg', asset: 'assets/bg/stage.jpg', transition: 'fade' },
        {
          type: 'text', speaker: null,
          content: 'Wayward 鳄鱼扛塔冲了进去——但奥恩的大招把他撞飞在塔下。死歌复活唱 R，瑟提从侧面包了过来。'
        },
        {
          type: 'text', speaker: null,
          content: 'Knight 阿狸被死歌 R 炸死在泉水门口。JackeyLove 被瑟提抱走。Tian 男枪换掉了奥恩，但 GAM 剩下三人已经开始反推。'
        },
        {
          type: 'text', speaker: 'wayward',
          content: '点基地！就差一刀！就差一刀啊！！'
        },
        {
          type: 'text', speaker: null,
          content: 'GAM 基地还剩最后 50 血。但 TES 全员阵亡。'
        },
        {
          type: 'text', speaker: null,
          content: '屏幕弹出"DEFEAT"。'
        },
        {
          type: 'text', speaker: null,
          content: 'GAM 的选手们从椅子上跳了起来。Levi 的死歌——我们没 ban 的死歌——成了全场的噩梦。'
        },
        {
          type: 'text', speaker: null,
          content: '战绩 1-3。DRX 和 RGE 已经确保晋级。TES 确定出局。'
        },
        {
          type: 'text', speaker: 'coach',
          content: '后面两场是荣誉之战。Wayward，你扛塔那波在干什么？'
        },
        {
          type: 'text', speaker: 'wayward',
          content: '我……'
        },
        {
          type: 'text', speaker: null,
          content: '历史重演了。输越南。全网喷。JackeyLove 赛后采访哭了。'
        },
        { type: 'cg', asset: 'assets/cg/match_defeat.jpg', overlay: 'DEFEAT · 输越南', darken: true, duration: 0 },
        {
          type: 'text', speaker: 'wayward',
          content: '如果……还能再重来一次……'
        }
      ]
    },

    /* ========== ch1_bad_02 内讧线 ========== */
    ch1_bad_02: {
      name: '坏结局：内讧',
      isEnding: true,
      beats: [
        { type: 'bg', asset: 'assets/bg/stage.jpg', transition: 'fade' },
        { type: 'char', id: 'coach', pos: 'center', enter: 'fade' },
        {
          type: 'text', speaker: 'coach',
          content: '这 BP 没法做！'
        },
        {
          type: 'text', speaker: null,
          content: '白色月牙把耳机摔在桌上。BP 倒计时还在走，但队内语音已经炸了。'
        },
        { type: 'char', id: 'jackey', pos: 'left', enter: 'slide' },
        {
          type: 'text', speaker: 'jackey',
          content: '这阵容怎么赢？我卢锡安加娜美，对面烈娜塔加卡莉斯塔，下路根本打不了！'
        },
        {
          type: 'text', speaker: 'coach',
          content: '你不试怎么知道打不了？训练赛你又不是没打过！'
        },
        {
          type: 'text', speaker: 'jackey',
          content: '训练赛和比赛能一样吗？！'
        },
        {
          type: 'text', speaker: 'wayward',
          content: '够了！都别吵了！选什么打什么行不行？！'
        },
        {
          type: 'text', speaker: null,
          content: '但已经晚了。BP 时间耗尽，TES 拿了一套四不像的阵容。比赛还没打，队内语音已经全是怨气。'
        },
        {
          type: 'text', speaker: null,
          content: '第一场被 GAM 碾压。战绩 1-3，确定出局。TES 成了 S12 最大的笑话。'
        }
      ]
    }
  }
};
