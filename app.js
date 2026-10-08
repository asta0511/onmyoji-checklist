/* 阴阳师清单 —— 多账号 / 分板块重置 / 收益结算 / 本地保存 */
(function () {
  'use strict';

  var DATA = window.ONMYOJI_DATA;
  var SECTIONS = DATA.sections;
  var RESET_HOUR = DATA.resetHour;
  var RES = DATA.resourceLabels;

  var STATE_KEY = 'onmyoji-checklist-v2';
  var PREF_KEY = 'onmyoji-checklist-prefs-v2';

  var ICON_UP = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8l4-4 4 4"/></svg>';
  var ICON_DOWN = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4l4 4 4-4"/></svg>';

  /* ---------- 建立索引 ---------- */
  var ALL_ITEMS = [];
  var ITEM_MAP = {};
  SECTIONS.forEach(function (sec) {
    sec.groups.forEach(function (grp) {
      grp.items.forEach(function (it) {
        it.sectionId = sec.id;
        it.groupId = grp.id;
        ALL_ITEMS.push(it);
        ITEM_MAP[it.id] = it;
      });
    });
  });

  function itemsOfSection(sectionId) {
    return ALL_ITEMS.filter(function (it) { return it.sectionId === sectionId; });
  }

  /* ---------- 工具 ---------- */
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function num(v) { var n = Number(v); return isFinite(n) && n > 0 ? n : 0; }

  function addGain(bag, gain) {
    if (!gain) return;
    for (var k in gain) { if (Object.prototype.hasOwnProperty.call(gain, k)) bag[k] = (bag[k] || 0) + gain[k]; }
  }

  function formatGain(gain) {
    if (!gain) return '';
    var out = [];
    ['jade', 'ticket', 'egg', 'shard'].forEach(function (k) {
      if (gain[k]) out.push(gain[k] + ' ' + RES[k]);
    });
    return out.join(' · ');
  }

  function chipLabels(it) {
    if (it.days) return it.days;
    if (it.labels) return it.labels;
    return [];
  }

  function hasCounters(it) { return !!(it.counters && it.counters.length); }

  /* ---------- 日期：以 RESET_HOUR 为分界 ---------- */
  function shiftToGameDay(date) {
    var d = new Date(date.getTime());
    if (d.getHours() < RESET_HOUR) d.setDate(d.getDate() - 1);
    return d;
  }

  function dayKey(date) { return ymd(shiftToGameDay(date)); }

  function weekKey(date) {
    var d = shiftToGameDay(date);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return 'W' + ymd(d);
  }

  function monthKey(date) { return date.getFullYear() + '-' + pad(date.getMonth() + 1); }

  function isoWeekNum(d) {
    var t = new Date(d.getTime());
    t.setHours(0, 0, 0, 0);
    t.setDate(t.getDate() + 3 - ((t.getDay() + 6) % 7));
    var week1 = new Date(t.getFullYear(), 0, 4);
    return 1 + Math.round(((t - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  }

  /* 每双数周周四刷新：返回最近一次刷新所在的周四 */
  function specialKey(now) {
    var d = new Date(now.getTime());
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 3);
    if (d.getTime() > now.getTime()) d.setDate(d.getDate() - 7);
    if (isoWeekNum(d) % 2 !== 0) d.setDate(d.getDate() - 7);
    return ymd(d);
  }

  function nextDailyReset(now) {
    var t = new Date(now.getTime());
    t.setHours(RESET_HOUR, 0, 0, 0);
    if (t.getTime() <= now.getTime()) t.setDate(t.getDate() + 1);
    return t;
  }

  /* ---------- 状态 ---------- */
  function emptyBucket() { return { key: '', done: {}, counters: {} }; }

  function emptyAccount(name) {
    return {
      name: name,
      daily: emptyBucket(),
      weekly: emptyBucket(),
      special: emptyBucket(),
      activity: { done: {}, counters: {} },
      shop: emptyBucket(),
      persist: { done: {}, counters: {} },
      monthly: emptyBucket(),
      manual: { jade: 0, ticket: 0, egg: 0, shard: 0, note: '' },
      log: {},
      days: []
    };
  }

  function loadJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      var v = JSON.parse(raw);
      return (v && typeof v === 'object') ? v : fallback;
    } catch (e) { return fallback; }
  }

  var prefs = Object.assign({ tab: SECTIONS[0].id, foldDone: false }, loadJSON(PREF_KEY, {}));

  var root = loadJSON(STATE_KEY, null);
  if (!root || !root.accounts) {
    root = { active: DATA.accounts[0], accounts: {} };
    DATA.accounts.forEach(function (n) { root.accounts[n] = emptyAccount(n); });
  }
  DATA.accounts.forEach(function (n) {
    if (!root.accounts[n]) root.accounts[n] = emptyAccount(n);
  });
  if (!root.accounts[root.active]) root.active = DATA.accounts[0];

  /* 补齐字段 */
  Object.keys(root.accounts).forEach(function (k) {
    var a = root.accounts[k];
    ['daily', 'weekly', 'special', 'shop', 'monthly'].forEach(function (f) {
      if (!a[f] || typeof a[f] !== 'object') a[f] = emptyBucket();
      if (!a[f].done) a[f].done = {};
      if (!a[f].counters) a[f].counters = {};
    });
    ['activity', 'persist'].forEach(function (f) {
      if (!a[f] || typeof a[f] !== 'object') a[f] = { done: {}, counters: {} };
      if (!a[f].done) a[f].done = {};
      if (!a[f].counters) a[f].counters = {};
    });
    if (!a.manual) a.manual = { jade: 0, ticket: 0, egg: 0, shard: 0, note: '' };
    if (!a.log || typeof a.log !== 'object') a.log = {};
    if (!Array.isArray(a.days)) a.days = [];
    if (!a.name) a.name = k;
  });

  function acct() { return root.accounts[root.active]; }

  function save() {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(root)); } catch (e) {}
  }
  function savePrefs() {
    try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (e) {}
  }

  function storeFor(sectionId) {
    var a = acct();
    if (sectionId === 'daily') return a.daily;
    if (sectionId === 'weekly') return a.weekly;
    if (sectionId === 'special') return a.special;
    if (sectionId === 'activity') return a.activity;
    if (sectionId === 'shop') return a.shop;
    return a.daily;
  }

  function bagOf(it) {
    return it.kind === 'persist' ? acct().persist : storeFor(it.sectionId);
  }

  /* ---------- 重置 ---------- */
  function syncKeys(now) {
    var a = acct();
    var changed = false;
    var dk = dayKey(now), wk = weekKey(now), sk = specialKey(now), mk = monthKey(now);

    if (a.daily.key !== dk) { a.daily = { key: dk, done: {}, counters: {} }; changed = true; }
    if (a.shop.key !== dk) { a.shop = { key: dk, done: {}, counters: {} }; changed = true; }
    if (a.weekly.key !== wk) { a.weekly = { key: wk, done: {}, counters: {} }; changed = true; }
    if (a.special.key !== sk) { a.special = { key: sk, done: {}, counters: {} }; changed = true; }
    if (a.monthly.key !== mk) { a.monthly = { key: mk, done: {}, counters: {} }; changed = true; }

    /* 活动到期自动清除 */
    itemsOfSection('activity').forEach(function (it) {
      if (isExpired(it, now)) {
        delete a.activity.done[it.id];
        delete a.activity.counters[it.id];
        chipLabels(it).forEach(function (l) { delete a.activity.done[it.id + '|' + l]; });
        changed = true;
      }
    });

    if (changed) save();
    return changed;
  }

  function isExpired(it, now) {
    if (!it.period) return false;
    var end = new Date(it.period.end + 'T23:59:59');
    return (now || new Date()).getTime() > end.getTime();
  }

  function isActive(it, now) {
    if (!it.period) return true;
    var n = now || new Date();
    return n.getTime() <= new Date(it.period.end + 'T23:59:59').getTime();
  }

  /* ---------- 完成状态 ---------- */
  function isItemDone(it) {
    var bag = bagOf(it);
    var labels = chipLabels(it);
    if (labels.length) {
      for (var i = 0; i < labels.length; i++) {
        if (!bag.done[it.id + '|' + labels[i]]) return false;
      }
      return true;
    }
    if (hasCounters(it)) return countersOf(it).some(function (v) { return v > 0; });
    return !!bag.done[it.id];
  }

  function countersOf(it) {
    var bag = bagOf(it);
    var arr = bag.counters[it.id];
    if (!Array.isArray(arr)) arr = [];
    return it.counters.map(function (c, i) { return num(arr[i]); });
  }

  function setCounter(it, idx, value) {
    var bag = bagOf(it);
    var arr = bag.counters[it.id];
    if (!Array.isArray(arr)) arr = it.counters.map(function () { return 0; });
    arr = arr.slice();
    var c = it.counters[idx];
    var v = Math.max(0, Math.min(num(value) || 0, c.max || 99999));
    arr[idx] = v;
    bag.counters[it.id] = arr;
    if (v > 0) touchToday();
    commit();
  }

  function toggleItem(it) {
    var bag = bagOf(it);
    var labels = chipLabels(it);
    if (labels.length) {
      var all = isItemDone(it);
      labels.forEach(function (l) {
        if (all) delete bag.done[it.id + '|' + l];
        else bag.done[it.id + '|' + l] = true;
      });
    } else {
      if (bag.done[it.id]) delete bag.done[it.id];
      else bag.done[it.id] = true;
    }
    touchToday();
    commit();
  }

  function toggleChip(it, label) {
    var bag = bagOf(it);
    var key = it.id + '|' + label;
    if (bag.done[key]) delete bag.done[key];
    else bag.done[key] = true;
    touchToday();
    commit();
  }

  function setItemDone(it, val) {
    var bag = bagOf(it);
    var labels = chipLabels(it);
    if (labels.length) {
      labels.forEach(function (l) {
        if (val) bag.done[it.id + '|' + l] = true;
        else delete bag.done[it.id + '|' + l];
      });
    } else if (hasCounters(it)) {
      if (val) {
        bag.counters[it.id] = it.counters.map(function (c) { return c.step || 1; });
      } else {
        bag.counters[it.id] = it.counters.map(function () { return 0; });
      }
    } else {
      if (val) bag.done[it.id] = true;
      else delete bag.done[it.id];
    }
  }

  /* 记录打卡日 */
  function touchToday() {
    var a = acct();
    var dk = dayKey(new Date());
    if (a.days.indexOf(dk) === -1) a.days.push(dk);
  }

  /* ---------- 收益结算 ---------- */
  function zeroIncome() { return { jade: 0, ticket: 0, egg: 0, shard: 0 }; }

  function computeIncome() {
    var inc = zeroIncome();
    var a = acct();

    ALL_ITEMS.forEach(function (it) {
      var bag = bagOf(it);
      var labels = chipLabels(it);
      if (labels.length) {
        labels.forEach(function (l) { if (bag.done[it.id + '|' + l]) addGain(inc, it.gain); });
      } else if (!hasCounters(it) && bag.done[it.id]) {
        addGain(inc, it.gain);
      }
      if (hasCounters(it)) {
        countersOf(it).forEach(function (v, i) {
          var c = it.counters[i];
          if (c.per) { for (var k in c.per) { if (c.per[k]) inc[k] += v * c.per[k]; } }
        });
      }
    });

    inc.jade += num(a.manual.jade);
    inc.ticket += num(a.manual.ticket);
    inc.egg += num(a.manual.egg);
    inc.shard += num(a.manual.shard);
    return inc;
  }

  /* 把今日收益写入历史，并返回 今日/昨日/本周/累计 */
  function commit() {
    var a = acct();
    var now = new Date();
    var today = computeIncome();
    a.log[dayKey(now)] = today;
    save();
    return today;
  }

  function incomeReport() {
    var a = acct();
    var now = new Date();
    var today = computeIncome();
    a.log[dayKey(now)] = today;

    var y = new Date(now.getTime() - 86400000);
    var yesterday = a.log[dayKey(y)] || zeroIncome();

    var week = zeroIncome();
    var mon = shiftToGameDay(now);
    mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
    for (var i = 0; i < 7; i++) {
      var d = new Date(mon.getTime());
      d.setDate(d.getDate() + i);
      var rec = a.log[ymd(d)];
      if (rec) addGain(week, rec);
    }

    var total = zeroIncome();
    Object.keys(a.log).forEach(function (k) { addGain(total, a.log[k]); });

    return { today: today, yesterday: yesterday, week: week, total: total };
  }

  /* ---------- DOM ---------- */
  var el = {
    accounts: document.getElementById('accounts'),
    tabs: document.getElementById('tabs'),
    sections: document.getElementById('sections'),
    versionBadge: document.getElementById('versionBadge'),
    statDaily: document.getElementById('statDaily'),
    statWeekly: document.getElementById('statWeekly'),
    statDays: document.getElementById('statDays'),
    barDaily: document.getElementById('barDaily'),
    barWeekly: document.getElementById('barWeekly'),
    countdown: document.getElementById('countdown'),
    totalIncome: document.getElementById('totalIncome'),
    dayLabel: document.getElementById('dayLabel'),
    foldDone: document.getElementById('foldDone'),
    batchAll: document.getElementById('batchAll'),
    resetSection: document.getElementById('resetSection'),
    resetDay: document.getElementById('resetDay'),
    resetAll: document.getElementById('resetAll'),
    toast: document.getElementById('toast')
  };

  var TABS = SECTIONS.map(function (s) { return { id: s.id, title: s.title }; });
  TABS.push({ id: 'income', title: '收益统计' });

  function sectionById(id) {
    return SECTIONS.filter(function (s) { return s.id === id; })[0];
  }

  /* ---------- 渲染 ---------- */
  function renderAccounts() {
    el.accounts.innerHTML = DATA.accounts.map(function (n) {
      var a = root.accounts[n];
      return '<button type="button" class="account' + (n === root.active ? ' is-active' : '') +
        '" data-account="' + n + '" title="双击可重命名">' + escapeHTML(a.name) + '</button>';
    }).join('');
  }

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function renderTabs() {
    el.tabs.innerHTML = TABS.map(function (t) {
      var label = '';
      if (t.id !== 'income') {
        var list = itemsOfSection(t.id).filter(function (it) { return isActive(it); });
        var done = list.filter(isItemDone).length;
        label = '<span class="tab__count">' + done + '/' + list.length + '</span>';
      }
      return '<button type="button" class="tab' + (t.id === prefs.tab ? ' is-active' : '') +
        '" role="tab" aria-selected="' + (t.id === prefs.tab) + '" data-tab="' + t.id + '">' +
        t.title + label + '</button>';
    }).join('');
  }

  function counterHTML(it, c, idx) {
    var vals = countersOf(it);
    var v = vals[idx];
    var presets = '';
    if (c.presets && c.presets.length) {
      presets = '<span class="presets">' + c.presets.map(function (p) {
        return '<button type="button" class="preset" data-act="preset" data-id="' + it.id +
          '" data-idx="' + idx + '" data-val="' + p + '">' + p + '</button>';
      }).join('') + '</span>';
    }
    return '<span class="counter">' +
      '<input class="counter__val" type="number" min="0" max="' + (c.max || 99999) + '" step="' + (c.step || 1) +
        '" value="' + v + '" data-act="counter" data-id="' + it.id + '" data-idx="' + idx + '" aria-label="' + escapeHTML(it.name) + ' ' + c.unit + '">' +
      '<span class="counter__btns">' +
        '<button type="button" class="counter__btn" data-act="inc" data-id="' + it.id + '" data-idx="' + idx + '" aria-label="增加">' + ICON_UP + '</button>' +
        '<button type="button" class="counter__btn" data-act="dec" data-id="' + it.id + '" data-idx="' + idx + '" aria-label="减少">' + ICON_DOWN + '</button>' +
      '</span>' +
      '<span class="counter__unit">' + escapeHTML(c.unit) + '</span>' +
    '</span>' + presets;
  }

  function itemHTML(it) {
    var labels = chipLabels(it);
    var counters = hasCounters(it);
    var done = isItemDone(it);
    var now = new Date();
    var expired = isExpired(it, now);

    var head = '<span class="item__check" aria-hidden="true"></span>';
    if (counters) head = '<span class="item__check item__check--ghost" aria-hidden="true"></span>';

    var meta = '';
    var gainText = formatGain(it.gain);
    if (gainText) meta += '<span class="item__reward">' + escapeHTML(gainText) + '</span>';
    if (it.period) {
      meta += '<span class="item__period' + (expired ? ' is-expired' : '') + '">' +
        escapeHTML(it.period.start) + ' ~ ' + escapeHTML(it.period.end) + (expired ? ' 已结束' : '') + '</span>';
    }

    var chips = '';
    if (labels.length) {
      var bag = bagOf(it);
      chips = '<div class="item__chips">' + labels.map(function (l) {
        var on = !!bag.done[it.id + '|' + l];
        return '<button type="button" class="chip' + (on ? ' is-on' : '') + '" data-act="chip" data-id="' +
          it.id + '" data-label="' + escapeHTML(l) + '">' + escapeHTML(l) + '</button>';
      }).join('') + '</div>';
    }

    var side = '';
    if (counters) {
      side = '<div class="item__side">' + it.counters.map(function (c, i) {
        return counterHTML(it, c, i);
      }).join('') + '</div>';
    }

    return '<li class="item' + (done ? ' is-done' : '') + (expired ? ' is-expired' : '') +
      '" data-id="' + it.id + '" data-checkable="' + (counters ? '0' : '1') + '">' +
      head +
      '<div class="item__body">' +
        '<div class="item__title"><span class="item__name">' + escapeHTML(it.name) + '</span>' + meta + '</div>' +
        (it.note ? '<div class="item__note">' + escapeHTML(it.note) + '</div>' : '') +
        chips +
      '</div>' +
      side +
    '</li>';
  }

  function renderTaskSection(sec) {
    var html = '<section class="section">' +
      '<header class="section__head">' +
        '<h2 class="section__title">' + sec.title + '</h2>' +
        '<span class="section__hint">' + sec.resetHint + '</span>' +
        '<span class="section__count" data-count-for="' + sec.id + '"></span>' +
      '</header>';

    var anyVisible = false;

    sec.groups.forEach(function (grp) {
      var items = grp.items.filter(function (it) { return isActive(it); });
      var visible = items.filter(function (it) { return !(prefs.foldDone && isItemDone(it)); });
      if (!visible.length) return;
      anyVisible = true;

      html += '<div class="group">';
      if (grp.title || grp.note || grp.batch) {
        html += '<div class="group__head">' +
          (grp.title ? '<h3 class="group__title">' + grp.title + '</h3>' : '') +
          (grp.note ? '<span class="group__note">' + grp.note + '</span>' : '') +
          (grp.batch ? '<button type="button" class="btn btn--mini" data-batch="' + grp.id + '">一键全部完成</button>' : '') +
        '</div>';
      }
      html += '<ul class="items">' + visible.map(itemHTML).join('') + '</ul></div>';
    });

    if (!anyVisible) {
      html += '<div class="empty">' + (prefs.foldDone ? '这个板块的项目都完成啦' : '暂无可打卡项目') + '</div>';
    }

    return html + '</section>';
  }

  function incomeRowHTML(label, rec) {
    return '<div class="income__row"><span>' + label + '</span><span class="income__vals">' +
      '<b>' + rec.jade + '</b><em>勾玉</em>' +
      '<b>' + rec.ticket + '</b><em>蓝票</em>' +
      '<b>' + rec.egg + '</b><em>黑蛋</em>' +
      '<b>' + rec.shard + '</b><em>黑碎</em>' +
    '</span></div>';
  }

  function renderIncomeSection() {
    var a = acct();
    var rep = incomeReport();
    save();

    return '<section class="section">' +
      '<header class="section__head">' +
        '<h2 class="section__title">收益统计</h2>' +
        '<span class="section__hint">勾选与步进器自动结算，按日汇总</span>' +
      '</header>' +
      '<div class="income">' +
        '<div class="income__block">' +
          '<h3>手动输入今日额外劳动所得</h3>' +
          '<div class="income__grid">' +
            '<div class="field"><label>勾玉</label><input type="number" min="0" data-manual="jade" value="' + num(a.manual.jade) + '"></div>' +
            '<div class="field"><label>蓝票</label><input type="number" min="0" data-manual="ticket" value="' + num(a.manual.ticket) + '"></div>' +
            '<div class="field"><label>黑蛋</label><input type="number" min="0" data-manual="egg" value="' + num(a.manual.egg) + '"></div>' +
            '<div class="field"><label>黑碎</label><input type="number" min="0" data-manual="shard" value="' + num(a.manual.shard) + '"></div>' +
            '<div class="field field--wide"><label>收益备注</label><input type="text" data-manual="note" value="' + escapeHTML(a.manual.note) + '" placeholder="例如：对弈竞猜赢了几场"></div>' +
          '</div>' +
        '</div>' +
        '<div class="income__block">' +
          '<h3>劳动所得汇总</h3>' +
          '<div class="income__rows">' +
            incomeRowHTML('今日劳动所得', rep.today) +
            incomeRowHTML('昨日劳动所得', rep.yesterday) +
            incomeRowHTML('本周劳动所得', rep.week) +
            incomeRowHTML('累计劳动所得', rep.total) +
          '</div>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  function renderSections() {
    if (prefs.tab === 'income') {
      el.sections.innerHTML = renderIncomeSection();
      el.batchAll.style.display = 'none';
      el.resetSection.style.display = 'none';
    } else {
      var sec = sectionById(prefs.tab);
      el.sections.innerHTML = renderTaskSection(sec);
      el.batchAll.style.display = '';
      el.resetSection.style.display = '';
    }
    updateSectionCount();
  }

  function updateSectionCount() {
    if (prefs.tab === 'income') return;
    var node = el.sections.querySelector('[data-count-for="' + prefs.tab + '"]');
    if (!node) return;
    var list = itemsOfSection(prefs.tab).filter(function (it) { return isActive(it); });
    var done = list.filter(isItemDone).length;
    node.innerHTML = '<b>' + done + '</b> / ' + list.length;
  }

  function renderHero() {
    var now = new Date();
    var a = acct();

    var dList = itemsOfSection('daily').filter(function (it) { return isActive(it); });
    var wList = itemsOfSection('weekly').filter(function (it) { return isActive(it); });
    var dDone = dList.filter(isItemDone).length;
    var wDone = wList.filter(isItemDone).length;

    el.statDaily.textContent = dDone + ' / ' + dList.length;
    el.statWeekly.textContent = wDone + ' / ' + wList.length;
    el.barDaily.style.width = (dList.length ? (dDone / dList.length) * 100 : 0) + '%';
    el.barWeekly.style.width = (wList.length ? (wDone / wList.length) * 100 : 0) + '%';
    el.statDays.textContent = a.days.length;

    var rep = incomeReport();
    save();
    el.totalIncome.innerHTML =
      '<span class="sumchip sumchip--title">累计劳动所得</span>' +
      '<span class="sumchip"><b>' + rep.total.jade + '</b> 勾玉</span>' +
      '<span class="sumchip"><b>' + rep.total.ticket + '</b> 蓝票</span>' +
      '<span class="sumchip"><b>' + rep.total.egg + '</b> 黑蛋</span>' +
      '<span class="sumchip"><b>' + rep.total.shard + '</b> 黑碎</span>';

    var weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    var dk = dayKey(now);
    el.dayLabel.textContent = now.getFullYear() + ' 年 ' + (now.getMonth() + 1) + ' 月 ' + now.getDate() +
      ' 日 · ' + weekdays[now.getDay()] + ' · 计数日 ' + dk + ' 00:00 ~ 次日 00:00';
  }

  function renderCountdown() {
    var target = nextDailyReset(new Date());
    var total = Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000));
    var h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
    el.countdown.textContent = pad(h) + ':' + pad(m) + ':' + pad(s);
  }

  function renderAll() {
    renderAccounts();
    renderTabs();
    renderSections();
    renderHero();
    el.foldDone.checked = prefs.foldDone;
  }

  /* ---------- Toast ---------- */
  var toastTimer = null;
  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.toast.classList.remove('is-show'); }, 2200);
  }

  /* ---------- 事件 ---------- */
  el.accounts.addEventListener('click', function (e) {
    var btn = e.target.closest('.account');
    if (!btn) return;
    root.active = btn.getAttribute('data-account');
    syncKeys(new Date());
    save();
    renderAll();
  });

  el.accounts.addEventListener('dblclick', function (e) {
    var btn = e.target.closest('.account');
    if (!btn) return;
    var key = btn.getAttribute('data-account');
    var name = window.prompt('给这个账号起个名字', root.accounts[key].name);
    if (name === null) return;
    name = name.trim();
    if (!name) return;
    root.accounts[key].name = name.slice(0, 12);
    save();
    renderAccounts();
  });

  el.tabs.addEventListener('click', function (e) {
    var btn = e.target.closest('.tab');
    if (!btn) return;
    prefs.tab = btn.getAttribute('data-tab');
    savePrefs();
    renderAll();
  });

  el.foldDone.addEventListener('change', function () {
    prefs.foldDone = el.foldDone.checked;
    savePrefs();
    renderSections();
  });

  el.sections.addEventListener('click', function (e) {
    var preset = e.target.closest('[data-act="preset"]');
    if (preset) {
      var pItem = ITEM_MAP[preset.getAttribute('data-id')];
      setCounter(pItem, Number(preset.getAttribute('data-idx')), Number(preset.getAttribute('data-val')));
      renderAll();
      return;
    }

    var inc = e.target.closest('[data-act="inc"]');
    var dec = e.target.closest('[data-act="dec"]');
    if (inc || dec) {
      var node = inc || dec;
      var it = ITEM_MAP[node.getAttribute('data-id')];
      var idx = Number(node.getAttribute('data-idx'));
      var cur = countersOf(it)[idx];
      var step = it.counters[idx].step || 1;
      setCounter(it, idx, inc ? cur + step : cur - step);
      renderAll();
      return;
    }

    var chip = e.target.closest('[data-act="chip"]');
    if (chip) {
      var cItem = ITEM_MAP[chip.getAttribute('data-id')];
      toggleChip(cItem, chip.getAttribute('data-label'));
      renderAll();
      return;
    }

    var batch = e.target.closest('[data-batch]');
    if (batch) {
      var gid = batch.getAttribute('data-batch');
      var sec = sectionById(prefs.tab);
      var grp = sec.groups.filter(function (g) { return g.id === gid; })[0];
      if (!grp) return;
      grp.items.forEach(function (it) { if (isActive(it)) setItemDone(it, true); });
      touchToday();
      commit();
      renderAll();
      toast('已全部完成');
      return;
    }

    var li = e.target.closest('.item');
    if (li && e.target.closest('.item__check')) {
      var t = ITEM_MAP[li.getAttribute('data-id')];
      if (hasCounters(t)) return;
      toggleItem(t);
      renderAll();
    }
  });

  el.sections.addEventListener('change', function (e) {
    var input = e.target.closest('[data-act="counter"]');
    if (input) {
      var it = ITEM_MAP[input.getAttribute('data-id')];
      setCounter(it, Number(input.getAttribute('data-idx')), Number(input.value));
      renderAll();
      return;
    }
    var manual = e.target.closest('[data-manual]');
    if (manual) {
      var key = manual.getAttribute('data-manual');
      acct().manual[key] = key === 'note' ? manual.value : num(manual.value);
      commit();
      renderAll();
    }
  });

  el.sections.addEventListener('input', function (e) {
    var manual = e.target.closest('[data-manual="note"]');
    if (manual) {
      acct().manual.note = manual.value;
      save();
    }
  });

  el.batchAll.addEventListener('click', function () {
    if (prefs.tab === 'income') return;
    var sec = sectionById(prefs.tab);
    sec.groups.forEach(function (grp) {
      grp.items.forEach(function (it) { if (isActive(it)) setItemDone(it, true); });
    });
    touchToday();
    commit();
    renderAll();
    toast('「' + sec.title + '」已全部完成');
  });

  el.resetSection.addEventListener('click', function () {
    if (prefs.tab === 'income') return;
    var sec = sectionById(prefs.tab);
    if (!window.confirm('确定清空「' + sec.title + '」的全部勾选与数字吗？')) return;
    var a = acct();
    var bag = storeFor(sec.id);
    if (sec.id === 'daily') { a.daily = { key: dayKey(new Date()), done: {}, counters: {} }; }
    else if (sec.id === 'weekly') { a.weekly = { key: weekKey(new Date()), done: {}, counters: {} }; }
    else if (sec.id === 'special') { a.special = { key: specialKey(new Date()), done: {}, counters: {} }; }
    else if (sec.id === 'shop') {
      a.shop = { key: dayKey(new Date()), done: {}, counters: {} };
      a.persist = { done: {}, counters: {} };
      a.monthly = { key: monthKey(new Date()), done: {}, counters: {} };
    } else {
      bag.done = {}; bag.counters = {};
    }
    commit();
    renderAll();
    toast('已重置' + sec.title);
  });

  el.resetDay.addEventListener('click', function () {
    if (!window.confirm('确定清空「每日任务」和「商店购买」的今日打卡吗？')) return;
    var a = acct();
    a.daily = { key: dayKey(new Date()), done: {}, counters: {} };
    a.shop = { key: dayKey(new Date()), done: {}, counters: {} };
    commit();
    renderAll();
    toast('本日打卡已重置');
  });

  el.resetAll.addEventListener('click', function () {
    if (!window.confirm('确定重置当前账号的全部勾选、数字与手动收益吗？\n（已打卡天数与劳动所得历史会保留）')) return;
    var key = root.active;
    var name = root.accounts[key].name;
    var fresh = emptyAccount(name);
    fresh.log = root.accounts[key].log;
    fresh.days = root.accounts[key].days;
    root.accounts[key] = fresh;
    syncKeys(new Date());
    save();
    renderAll();
    toast('已全部重置');
  });

  /* ---------- 启动 ---------- */
  if (!TABS.some(function (t) { return t.id === prefs.tab; })) prefs.tab = SECTIONS[0].id;
  if (el.versionBadge) el.versionBadge.textContent = DATA.version;
  syncKeys(new Date());
  commit();
  renderAll();
  renderCountdown();

  setInterval(renderCountdown, 1000);
  setInterval(function () {
    if (syncKeys(new Date())) { commit(); renderAll(); }
  }, 30000);

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && syncKeys(new Date())) { commit(); renderAll(); }
  });
})();
