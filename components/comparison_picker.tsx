'use client';

import styles from './comparison_picker.module.css';

export default async function ComparisonPicker() {
  return (
    <div className={styles.picker}>
      <div className={styles.archPicker}>
        <label>
          Architecture:

          <select onChange={e => { }}>
            <option>macOS</option>
            <option>Windows</option>
            <option>Linux</option>
          </select>
        </label>
      </div>
      <div className={styles.datePicker}>
        <label>
          Date:

          <input type="date" value="2024-01-01" onChange={e => { }} />
        </label>
      </div>
    </div>
  );
}
