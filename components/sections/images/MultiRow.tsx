import Image from "next/image";
import {PortableTextBlock} from "@/components/global/components";
import {PortableText} from "@portabletext/react";
import styles from "./MultiRow.module.css";
import { motion } from "motion/react";

interface Member {
  image: {
    asset: {
      _id: string;
      url: string;
    };
    hotspot?: {
      x: number;
      y: number;
      height: number;
      width: number;
    };
  };
  name: string;
  position: string;
  description: PortableTextBlock[];
}

interface MultiRowProps {
  members: Member[];
}

export default function MultiRow({members}: MultiRowProps) {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {members.map((member, index) => (
          <motion.div
            key={index}
            className={`${styles.row} ${
              index !== members.length - 1 ? styles.border : ""
            }`}
            initial={{ y: 10, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.12 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.06 }}
          >
            <motion.div
              className={styles.image}
              initial={{ scale: 0.99, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, amount: 0.12 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.06 + index * 0.03 }}
            >
              <Image
                src={member.image.asset.url}
                alt={member.name}
                width={420}
                height={560}
              />
            </motion.div>

            <motion.div
              className={styles.content}
              initial={{ x: 6, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.12 }}
              transition={{ duration: 0.55, ease: "easeOut", delay: 0.08 + index * 0.04 }}
            >
              <h3>{member.name}</h3>

              <h4>{member.position}</h4>

              <div className={styles.description}>
                <PortableText value={member.description} />
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}