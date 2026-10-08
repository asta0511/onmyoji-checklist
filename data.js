/* 阴阳师清单数据
 * 结构参考：B站「本命英雄拉克丝」的痒痒鼠打卡工具（https://devfile.vip/preview/e5wr9cuv）
 * 攻略备注整理自《2025 痒痒鼠课程表 by 妹酱的小本本》
 *
 * 想增删任务，只改下面的 sections 即可。
 * item 字段说明：
 *   id       必填，全局唯一
 *   name     任务名
 *   note     备注 / 攻略提示（可省略）
 *   gain     完成后计入的收益，如 { jade: 20, ticket: 1 }
 *   counters 行内数字步进器，如 [{ unit:'勾玉', step:20, max:60, presets:[20,40,60], per:{jade:1} }]
 *   days     星期标签，如 ['周一','周二']
 *   labels   自定义标签（活动日期 / 场次等），如 ['10.5','10.6']
 *   period   活动有效期 { start:'2026-09-30', end:'2026-10-13' }，过期自动清除
 *   kind     'persist' 永不自重置（如永久勾玉卡）/ 'monthly' 每月重置
 */
window.ONMYOJI_DATA = {
  version: 'v1.1.0',
  resetHour: 0,
  accounts: ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6'],
  resourceLabels: { jade: '勾玉', ticket: '蓝票', egg: '黑蛋', shard: '黑碎' },

  sections: [
    /* ============ 每日任务 ============ */
    {
      id: 'daily',
      title: '每日任务',
      resetHint: '每日 00:00 自动重置',
      reset: 'daily',
      groups: [
        {
          id: 'g-signin',
          title: '一键签到内容',
          batch: true,
          items: [
            { id: 'd-signin', name: '签到' },
            { id: 'd-dashen', name: '大神签到' },
            { id: 'd-draw', name: '每日一抽' },
            { id: 'd-friend', name: '友情点 200' },
            { id: 'd-jiwen', name: '吉闻' },
            { id: 'd-pet', name: '宠物奖励', counters: [{ unit: '勾玉蓝票', step: 1, max: 30 }] }
          ]
        },
        {
          id: 'g-daily-other',
          title: '其他',
          items: [
            { id: 'd-liao30', name: '寮三十', note: '按需求捐材料 / 寮友组队，组队推荐打魂土并开御魂加成' },
            { id: 'd-shop-check', name: '商店签到', note: '礼包屋每日可领一次免费礼包' }
          ]
        },
        {
          id: 'g-bounty',
          title: '悬赏任务',
          items: [
            { id: 'd-bounty-am', name: '上午', counters: [{ unit: '勾玉', step: 20, max: 200, per: { jade: 1 } }] },
            { id: 'd-bounty-pm', name: '下午', counters: [{ unit: '勾玉', step: 20, max: 200, per: { jade: 1 } }] }
          ]
        },
        {
          id: 'g-daily-misc',
          title: null,
          items: [
            { id: 'd-coin', name: '金币妖怪', note: '推荐组队金币更多，记得开金币加成' },
            { id: 'd-exp', name: '经验妖怪', note: '缺狗粮 / 源赖光没满级可以打' },
            { id: 'd-region', name: '地域鬼王', note: '萌新打 1 级热门鬼王；大佬打极地鬼概率黑蛋；每周分享 1 次有 20 勾', counters: [{ unit: '勾玉', step: 20, max: 60, presets: [20, 40, 60], per: { jade: 1 } }] },
            { id: 'd-flower', name: '花合战 100', gain: { jade: 20 } },
            { id: 'd-fengmo', name: '逢魔 4 次 + BOSS', note: '答题 / 突破 / 御魂 / 探索等小任务必做；式神挑战必打，天照 + 座敷 + 铁鼠；优先极逢魔' },
            { id: 'd-barrier', name: '结界突破', note: '晚上打，把突破券清完防止溢出，有勾玉奖励' },
            { id: 'd-dispatch', name: '式神委派', note: '只做弥助的画，推荐式神星级越高，完美达成概率越高' },
            { id: 'd-shard', name: '碎片' }
          ]
        },
        {
          id: 'g-foster',
          title: '寄养',
          note: '每 6 小时一次，顺便领寮体力 / 溢出体力经验',
          items: [
            { id: 'd-foster-am', name: '早', counters: [{ unit: '勾玉', step: 20, max: 200, per: { jade: 1 } }] },
            { id: 'd-foster-noon', name: '中', counters: [{ unit: '勾玉', step: 20, max: 200, per: { jade: 1 } }] },
            { id: 'd-foster-pm', name: '晚', counters: [{ unit: '勾玉', step: 20, max: 200, per: { jade: 1 } }] },
            { id: 'd-foster-card', name: '结界卡', counters: [{ unit: '勾玉', step: 20, max: 200, per: { jade: 1 } }] }
          ]
        }
      ]
    },

    /* ============ 每周任务 ============ */
    {
      id: 'weekly',
      title: '每周任务',
      resetHint: '每周一 00:00 自动重置',
      reset: 'weekly',
      groups: [
        {
          id: 'g-mystery',
          title: '神秘商店',
          items: [
            { id: 'w-mystery', name: '本周刷新', days: ['周三', '周六'] }
          ]
        },
        {
          id: 'g-liao-act',
          title: '寮活动',
          items: [
            { id: 'w-hunt', name: '狩猎战', days: ['周一', '周二', '周三', '周四'] },
            { id: 'w-dojo', name: '道馆', days: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
            { id: 'w-narrow', name: '狭间暗域', days: ['周五', '周六', '周日'] },
            { id: 'w-retreat', name: '首领退治', days: ['周六'] },
            { id: 'w-yinjie', name: '阴界之门', days: ['周五', '周六', '周日'] },
            { id: 'w-banquet', name: '阴阳寮宴会', labels: ['1', '2'] }
          ]
        },
        {
          id: 'g-fixed',
          title: '固定奖励类',
          items: [
            { id: 'w-mijuan', name: '秘闻', gain: { jade: 385 } },
            { id: 'w-tujian', name: '图鉴分享', gain: { ticket: 1 } },
            { id: 'w-mijuan-share', name: '秘闻分享', gain: { jade: 20 } },
            { id: 'w-region-share', name: '地域鬼王分享', gain: { jade: 20 } }
          ]
        },
        {
          id: 'g-exchange',
          title: '兑换奖励类',
          items: [
            { id: 'w-medal', name: '勋章商店', counters: [{ unit: '蓝票', step: 1, max: 1, per: { ticket: 1 } }, { unit: '黑蛋', step: 1, max: 1, per: { egg: 1 } }] },
            { id: 'w-liao-shop', name: '寮商店', counters: [{ unit: '蓝票', step: 1, max: 2, per: { ticket: 1 } }, { unit: '黑碎', step: 1, max: 3, per: { shard: 1 } }] },
            { id: 'w-hyakki', name: '百鬼弈 / 百鬼棋局（鼬乐园币）', counters: [{ unit: '勾玉', step: 10, max: 130, presets: [50, 100, 130], per: { jade: 1 } }] },
            { id: 'w-honor', name: '荣誉商店', counters: [{ unit: '蓝票', step: 1, max: 2, per: { ticket: 1 } }, { unit: '黑碎', step: 1, max: 2, per: { shard: 1 } }] },
            { id: 'w-qianwu', name: '千物宝库', counters: [{ unit: '蓝票', step: 1, max: 1, per: { ticket: 1 } }, { unit: '黑碎', step: 1, max: 1, per: { shard: 1 } }] }
          ]
        },
        {
          id: 'g-tier',
          title: '分档奖励类',
          items: [
            { id: 'w-coop', name: '协同', counters: [{ unit: '勾玉', step: 20, max: 200, per: { jade: 1 } }] },
            { id: 'w-duel', name: '斗技', counters: [{ unit: '勾玉', step: 20, max: 200, per: { jade: 1 } }] }
          ]
        },
        {
          id: 'g-battle',
          title: '战斗及其他奖励类',
          items: [
            { id: 'w-liao3', name: '寮三抽', note: '每周可抽 3 次，别忘记' },
            { id: 'w-liudao', name: '六道之门 2 次', note: '萌新推荐打椒图；双倍道具最多存 4 个，溢出不再送' },
            { id: 'w-qiling', name: '契灵 2000 契忆', note: '批量召唤镇墓兽，低级式盘故意失败刷契忆' },
            { id: 'w-rilun', name: '日轮 150 次' },
            { id: 'w-yongsheng', name: '永生之海 30 次', note: '开金币加成，最好带铁鼠阵容' },
            { id: 'w-jishou', name: '寄售券' },
            { id: 'w-zhenshe', name: '真蛇', note: '带铁鼠阵容，只吃铁鼠金币加成，不吃御魂和金币加成' }
          ]
        }
      ]
    },

    /* ============ 特殊兑换 ============ */
    {
      id: 'special',
      title: '特殊兑换',
      resetHint: '每双数周周四自动刷新',
      reset: 'biweekly',
      groups: [
        {
          id: 'g-special',
          title: null,
          items: [
            { id: 's-shenkan', name: '神龛', note: '黑蛋 / 高星白蛋必买；万年竹 / 人面树 / 海忍 / 天井下 / 兔丸传记有黑蛋', counters: [{ unit: '黑蛋', step: 1, max: 1, per: { egg: 1 } }] }
          ]
        }
      ]
    },

    /* ============ 版本福利及活动 ============ */
    {
      id: 'activity',
      title: '版本福利及活动',
      resetHint: '活动期内打卡 · 到期自动清除',
      reset: 'activity',
      groups: [
        {
          id: 'g-activity',
          title: null,
          items: [
            { id: 'a-duiyi', name: '对弈竞猜', note: '每天 7 场，全勤 49 场约需预留 1500 万金币；对弈商店同期开放', period: { start: '2026-09-30', end: '2026-10-13' }, counters: [{ unit: '勾玉', step: 50, max: 2000, per: { jade: 1 } }, { unit: '蓝票', step: 1, max: 50, per: { ticket: 1 } }] },
            { id: 'a-weizai', name: '为崽而战 · 浮世之航', note: '寝肥合战每日 11:30、20:00 各开放一场；百妖之巅共 3 轮冲榜', period: { start: '2026-09-23', end: '2026-10-20' } },
            { id: 'a-yingyuan', name: '我加入的应援寮', period: { start: '2026-09-23', end: '2026-10-20' } },
            { id: 'a-qinfei', name: '寝肥合战', note: '对寝肥造成伤害或提交食材即算参与，个人奖励概率黑碎', period: { start: '2026-10-05', end: '2026-10-11' }, labels: ['10.5', '10.6', '10.7', '10.8', '10.9', '10.10', '10.11'] },
            { id: 'a-baiyao', name: '百妖之巅', note: '共 3 轮冲榜挑战，任选区域，按最终排名获得动态头像框', period: { start: '2026-10-05', end: '2026-10-11' }, labels: ['1', '2', '3'] },
            { id: 'a-shoucha', name: '应援手札', note: '每日任务累计应援等级，解锁御行达摩、限定头像框 / 插画', period: { start: '2026-09-28', end: '2026-10-11' } },
            { id: 'a-shiguang', name: '拾光永恒', note: '完成后打卡，不重置。注意派遣、樱饼特权礼和五倍券的领取顺序', period: { start: '2026-09-09', end: '2026-10-13' } }
          ]
        }
      ]
    },

    /* ============ 商店购买 ============ */
    {
      id: 'shop',
      title: '商店购买',
      resetHint: '勾选后自动增加收益，按日结算',
      reset: 'daily',
      groups: [
        {
          id: 'g-shop',
          title: null,
          items: [
            { id: 'p-jade-card', name: '永久勾玉卡', note: '每天自动 +20 勾玉（勾选一次即可）', kind: 'persist', gain: { jade: 20 } },
            { id: 'p-monthly', name: '月度运势礼', note: '激活日起当月每天 +20 勾玉（月底失效，月初需重新勾选）', kind: 'monthly', gain: { jade: 20 } }
          ]
        }
      ]
    }
  ]
};
