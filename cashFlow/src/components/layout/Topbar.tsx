import styles from "./Topbar.module.css";

export default function Topbar() {
  return (
    <header className={styles.topbar}>
      <div className={styles.title}>
        Overview
      </div>
      <div className={styles.actions}>
        <div className={styles.avatar}>ME</div>
      </div>
    </header>
  );
}
