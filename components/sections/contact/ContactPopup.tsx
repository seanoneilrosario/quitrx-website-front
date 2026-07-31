"use client";

import styles from "./ContactPopup.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ContactPopup({
  open,
  onClose,
}: Props) {
  return (
    <>
      {/* <div
        className={`${styles.overlay} ${open ? styles.show : ""}`}
        onClick={onClose}
      /> */}

      <div className={`${styles.popup} ${open ? styles.open : ""}`}>
        <button
          className={styles.close}
          onClick={onClose}
        >
          ×
        </button>

        <form className={styles.form}>
          <div className="inputs-wrapper">
            <input placeholder="Name" />
          <input placeholder="Company" />
          <input placeholder="Email" />
          <input placeholder="Telephone" />

          <textarea
            placeholder="Message"
            rows={1}
          />
          </div>

          <button
            type="submit"
            className={styles.submit}
          >
            <span>Submit Form</span>
            <span className={styles.circle}><svg className="-rotate-90" xmlns="http://www.w3.org/2000/svg" width="16.516" height="18.102" viewBox="0 0 18.516 18.102">
                  <g id="Icon_feather-arrow-down" data-name="Icon feather-arrow-down" transform="translate(-6.793 -7)">
                    <path id="Path_11" data-name="Path 11" d="M18,7.5V24.6" transform="translate(-1.949 0)" fill="none" stroke="#b59a73" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"/>
                    <path id="Path_12" data-name="Path 12" d="M24.6,18l-8.551,8.551L7.5,18" transform="translate(0 -1.949)" fill="none" stroke="#b59a73" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"/>
                  </g>
                </svg></span>
          </button>
        </form>
      </div>
    </>
  );
}