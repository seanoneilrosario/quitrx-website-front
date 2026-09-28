import Link from "next/link";
import styles from "./HeadingWithLink.module.css";
import { motion } from "motion/react";

interface HeadingWithLinkProps {
  eyebrow?: string;
  heading: string;
  left_description?: string;
  right_description?: string;
  button_text?: string;
  button_link?: string;
  eyebrow_max_width?: number;
}

export default function HeadingWithLink({
  eyebrow,
  heading,
  left_description,
  right_description,
  button_text,
  button_link,
  eyebrow_max_width,
}: HeadingWithLinkProps) {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.wrapper}>
          {eyebrow && (
            <motion.div
              className={styles.eyebrow}
              style={{ maxWidth: eyebrow_max_width && eyebrow_max_width > 0 ? `${eyebrow_max_width}px` : "auto", width: eyebrow_max_width ? `100%` : "auto" }}
              initial={{ y: 6, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.12 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.12 }}
                transition={{ duration: 0.35, delay: 0.05 }}
              >
                {eyebrow}
              </motion.p>
            </motion.div>
          )}

          <div className={styles.content}>
            <motion.h2
              initial={{ y: 8, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.12 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {heading}
            </motion.h2>

            {left_description || right_description ? (
              <motion.div
                className={styles.columns}
                initial={{ y: 6, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.12 }}
                transition={{ duration: 0.55, ease: "easeOut", delay: 0.06 }}
              >
                {left_description && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, amount: 0.12 }}
                    transition={{ duration: 0.35, delay: 0.08 }}
                  >
                    {left_description}
                  </motion.p>
                )}

                {right_description && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, amount: 0.12 }}
                    transition={{ duration: 0.35, delay: 0.1 }}
                  >
                    {right_description}
                  </motion.p>
                )}
              </motion.div>
            ) : null}

          </div>
        </div>
        {button_link && button_text && (
            <Link href={button_link} className={styles.button}>
              <span>{button_text}</span>

              <span className={styles.arrow}>
                <svg className="-rotate-90" xmlns="http://www.w3.org/2000/svg" width="18.516" height="18.102" viewBox="0 0 18.516 18.102">
                  <g id="Icon_feather-arrow-down" data-name="Icon feather-arrow-down" transform="translate(-6.793 -7)">
                    <path id="Path_11" data-name="Path 11" d="M18,7.5V24.6" transform="translate(-1.949 0)" fill="none" stroke="#b59a73" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"/>
                    <path id="Path_12" data-name="Path 12" d="M24.6,18l-8.551,8.551L7.5,18" transform="translate(0 -1.949)" fill="none" stroke="#b59a73" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"/>
                  </g>
                </svg>
              </span>
            </Link>
          )}
      </div>
    </section>
  );
}