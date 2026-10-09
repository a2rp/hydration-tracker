import { useEffect, useMemo, useState } from "react";
import { FiArrowLeft, FiArrowRight, FiCalendar, FiCheck, FiDroplet, FiPlus, FiTarget, FiTrash2 } from "react-icons/fi";
import ConfirmDialog from "../confirmDialog";
import styles from "./styles.module.css";

const storageKey = "sipline-drinks";
const goalKey = "sipline-daily-goal";
const dateAt = (offset = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
};
const moveDate = (value, offset) => {
    const date = new Date(value + "T12:00:00");
    date.setDate(date.getDate() + offset);
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
};
const sampleDate = dateAt(0);
const samples = [
    { id: 1, date: sampleDate, time: "08:10", amount: 350 },
    { id: 2, date: sampleDate, time: "10:35", amount: 500 },
    { id: 3, date: sampleDate, time: "12:50", amount: 250 },
    { id: 4, date: sampleDate, time: "14:20", amount: 400 },
];
const readDrinks = () => { try { const saved = localStorage.getItem(storageKey); return saved ? JSON.parse(saved) : samples; } catch { return samples; } };
const readGoal = () => { const saved = Number(localStorage.getItem(goalKey)); return saved >= 500 ? saved : 2000; };
const formatDate = (value, options = { weekday: "short", day: "numeric", month: "short" }) => new Intl.DateTimeFormat("en", options).format(new Date(value + "T12:00:00"));
const formatAmount = (value) => Number(value).toLocaleString("en-US");
const formatTime = (value) => {
    if (!value) return "Drink added";
    if (/\b(?:AM|PM)\b/i.test(value)) return value;
    return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date("2000-01-01T" + value));
};

const HydrationTracker = () => {
    const [today] = useState(() => dateAt(0));
    const [selectedDate, setSelectedDate] = useState(() => dateAt(0));
    const [drinks, setDrinks] = useState(readDrinks);
    const [goal, setGoal] = useState(readGoal);
    const [custom, setCustom] = useState("");
    const [pendingDelete, setPendingDelete] = useState(null);
    useEffect(() => localStorage.setItem(storageKey, JSON.stringify(drinks)), [drinks]);
    useEffect(() => localStorage.setItem(goalKey, String(goal)), [goal]);

    const dayDrinks = useMemo(() => drinks.filter((item) => item.date === selectedDate).sort((a, b) => b.time.localeCompare(a.time)), [drinks, selectedDate]);
    const total = dayDrinks.reduce((sum, item) => sum + Number(item.amount), 0);
    const percentage = Math.min(100, Math.round(total / goal * 100));
    const remaining = Math.max(0, goal - total);
    const week = Array.from({ length: 7 }, (_, index) => {
        const date = moveDate(selectedDate, index - 6);
        return { date, label: new Intl.DateTimeFormat("en", { weekday: "short" }).format(new Date(date + "T12:00:00")), amount: drinks.filter((item) => item.date === date).reduce((sum, item) => sum + Number(item.amount), 0) };
    });
    const chartMax = Math.max(goal, ...week.map((item) => item.amount));
    const isToday = selectedDate === today;

    const addDrink = (amount) => {
        const value = Number(amount);
        if (!value || value < 1 || !isToday) return;
        const time = new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());
        setDrinks((current) => [...current, { id: Date.now(), date: today, time, amount: value }]);
        setCustom("");
    };
    const submitCustom = (event) => { event.preventDefault(); addDrink(custom); };
    const removeDrink = () => { setDrinks((current) => current.filter((item) => item.id !== pendingDelete.id)); setPendingDelete(null); };

    return <section className={styles.hydrationTracker} id="today">
        <div className={styles.hero}><div><p className={styles.context}>A SMALL PAUSE FOR YOURSELF</p><h1>Find your<br /><span>water rhythm.</span></h1><p className={styles.description}>A gentle check-in for how much you have had today.</p></div><div className={styles.heroNote}><span><FiDroplet aria-hidden="true" /></span><p>Small sips<br />add up.</p><div className={styles.waveMark}><i /><i /><i /><i /><i /></div></div></div>

        <div className={styles.mainGrid}>
            <section className={styles.intakeCard} id="goal">
                <div className={styles.dateHeading}><div><span>YOUR DAY</span><strong>{isToday ? "Today" : formatDate(selectedDate)}</strong></div><div className={styles.dateButtons}><button type="button" aria-label="Previous day" onClick={() => setSelectedDate((date) => moveDate(date, -1))}><FiArrowLeft aria-hidden="true" /></button><button type="button" aria-label="Next day" disabled={isToday} onClick={() => setSelectedDate((date) => moveDate(date, 1))}><FiArrowRight aria-hidden="true" /></button>{!isToday && <button className={styles.todayButton} type="button" onClick={() => setSelectedDate(today)}>Today</button>}</div></div>
                <div className={styles.intakeBody}>
                    <div className={styles.progressRing} style={{ "--water-progress": percentage + "%" }}><div><FiDroplet aria-hidden="true" /><strong>{formatAmount(total)}<small> ml</small></strong><span>of {formatAmount(goal)} ml</span></div></div>
                    <div className={styles.progressCopy}><span className={styles.progressPercent}>{percentage}%</span><h2>{total >= goal ? "Daily goal reached" : "Keep your glass nearby."}</h2><p>{total >= goal ? "Nice work staying tuned in to your day." : formatAmount(remaining) + " ml left in your personal goal."}</p><div className={styles.goalInput}><FiTarget aria-hidden="true" /><label>Daily goal<input aria-label="Daily water goal in milliliters" type="number" min="500" step="250" value={goal} onChange={(event) => setGoal(Math.max(500, Number(event.target.value) || 500))} /><span>ml</span></label></div></div>
                </div>
                <div className={styles.quickAdd}><div className={styles.quickHeading}><h3>Add a drink</h3><span>Choose an amount</span></div><div className={styles.quickButtons}>{[150, 250, 500].map((amount) => <button type="button" key={amount} disabled={!isToday} onClick={() => addDrink(amount)}><span><FiPlus aria-hidden="true" /></span><strong>{amount} ml</strong></button>)}</div><form className={styles.customForm} onSubmit={submitCustom}><label htmlFor="custom-amount">Custom amount</label><div><input id="custom-amount" type="number" min="1" max="3000" step="25" value={custom} onChange={(event) => setCustom(event.target.value)} placeholder="Enter ml" disabled={!isToday} required /><button type="submit" disabled={!isToday}>Add drink <FiPlus aria-hidden="true" /></button></div></form></div>
            </section>

            <section className={styles.historyCard} aria-labelledby="drink-log-title"><div className={styles.historyHeading}><span className={styles.historyIcon}><FiCalendar aria-hidden="true" /></span><div><h2 id="drink-log-title">Drink log</h2><p>{formatDate(selectedDate, { weekday: "long", day: "numeric", month: "long" })}</p></div><span className={styles.logCount}>{dayDrinks.length} entries</span></div>
                <div className={styles.drinkList}>{dayDrinks.map((item, index) => <article className={styles.drinkRow} key={item.id}><span className={styles.drinkDrop}><FiDroplet aria-hidden="true" /></span><div><strong>{formatAmount(item.amount)} ml</strong><small>{formatTime(item.time)}</small></div><span className={styles.glassNumber}>{String(index + 1).padStart(2, "0")}</span><button type="button" aria-label={"Remove " + item.amount + " milliliter drink entry"} onClick={() => setPendingDelete(item)}><FiTrash2 aria-hidden="true" /></button></article>)}{dayDrinks.length === 0 && <div className={styles.empty}><FiDroplet aria-hidden="true" /><p>No drinks logged for this day.</p></div>}</div>
                <div className={styles.logFooter}><FiCheck aria-hidden="true" /><span>{total >= goal ? "Goal complete" : "Saved on this device"}</span><strong>{formatAmount(total)} ml</strong></div>
            </section>
        </div>

        <section className={styles.weekCard} id="history"><div className={styles.weekHeading}><div><h2>Your week in water</h2><p>Seven days ending {formatDate(selectedDate)}</p></div><span className={styles.weekUnit}>MILLILITERS</span></div><div className={styles.weekChart} role="img" aria-label={"Water intake during the seven days ending on " + formatDate(selectedDate)}>{week.map((item) => <div className={styles.weekColumn} key={item.date}><span>{item.amount ? formatAmount(item.amount) : ""}</span><div className={styles.weekBar}><i className={item.date === selectedDate ? styles.selectedDay : ""} style={{ height: Math.max(item.amount ? 5 : 0, item.amount / chartMax * 100) + "%" }} /></div><small>{item.label}</small></div>)}</div><div className={styles.goalLegend}><span><i /> Daily goal: {formatAmount(goal)} ml</span><span>Everyone's needs are different. Use a target that suits you.</span></div></section>
        <p className={styles.disclaimer}>This tracker is a personal log, not medical guidance. Water needs vary with activity, health, climate, and other factors.</p>
        {pendingDelete && <ConfirmDialog title="Remove this drink entry?" description={formatAmount(pendingDelete.amount) + " ml will be removed from this day's total."} confirmLabel="Remove entry" onCancel={() => setPendingDelete(null)} onConfirm={removeDrink} />}
    </section>;
};

export default HydrationTracker;
