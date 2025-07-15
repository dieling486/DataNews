import React from 'react';
import styles from './WorkDetail.module.css';
import WorkIntro from '../components/WorkIntro';
import WorkChart from '../components/WorkChart';
import ReferenceList from '../components/ReferenceList';

export default function Work() {
  return (
    <div className={styles.container}>
      <div className={styles.center}>
        <div className={styles.card}>
          <WorkIntro />
        </div>
        <div className={styles.card}>
          <WorkChart />
        </div>
        <div className={styles.card}>
          <ReferenceList />
        </div>
      </div>
    </div>
  );
} 