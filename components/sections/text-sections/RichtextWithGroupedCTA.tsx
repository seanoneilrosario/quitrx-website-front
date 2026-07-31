"use client";

import { useEffect, useState } from "react";

import { PortableText } from "next-sanity";

import "./richtext-grouped-cta.css";

import { PortableTextBlock } from "@/components/global/components";
import { useWindowWide } from "@/hooks/screenSize";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface CTAButton {
  label: string;
  description: PortableTextBlock[];
}

interface CTAGroup {
  group_title: string;
  buttons: CTAButton[];
}

interface Props {
  title: string;
  cta_groups: CTAGroup[];
  desktop_left_width: number;
  activeSection?: string;
}

const RichtextWithGroupedCTA = ({
  title,
  cta_groups,
  desktop_left_width,
  activeSection
}: Props ) => {
  const [activeGroup, setActiveGroup] = useState<number | null>(null);
  const [activeButton, setActiveButton] = useState<number | null>(null);
  const [closeButtons, setCloseButtons] = useState(false);
  const [hideButtons, setHideButtons] = useState(false);
  const [slugTitle, setSlugTitle] = useState("");

  const [exiting, setExiting] = useState<{
    group: number;
    button: number;
  } | null>(null);

  const pathname = usePathname();

  const wide = useWindowWide();

  const leftStyle =
    wide !== null && wide >= 1024
      ? {
          width: `${desktop_left_width}%`,
        }
      : {};

  const handleChange = (
    groupIndex: number,
    buttonIndex: number
  ) => {
    if (
      activeGroup === groupIndex &&
      activeButton === buttonIndex
    ) {
      return;
    }

    if (
      activeGroup !== null &&
      activeButton !== null
    ) {
      setExiting({
        group: activeGroup,
        button: activeButton,
      });
    }

    setTimeout(() => {
      setActiveGroup(groupIndex);
      setActiveButton(buttonIndex);
      setExiting(null);
    }, 700);
  };


  const handleCloseButtons = () => {
    // CLOSE
    if (!closeButtons) {
      setCloseButtons(true);

      setTimeout(() => {
        setHideButtons(true);
      }, 700);

    // OPEN
    } else {
      // show first
      setHideButtons(false);

      // wait next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setCloseButtons(false);
        });
      });
    }
  };
  
  const segments = pathname.split("/").filter(Boolean);

  const basePath = segments.length
    ? `/${segments[0]}`
    : "/";

  useEffect(() => {
    if (!activeSection) return;

    cta_groups.forEach((group, groupIndex) => {
      group.buttons.forEach((button, buttonIndex) => {
        const buttonSlug = button.label
          .toLowerCase()
          .replace(/\s+/g, "-");

        if (buttonSlug === activeSection) {
          setActiveGroup(groupIndex);
          setActiveButton(buttonIndex);
        }
      });
    });
  }, [activeSection, cta_groups]);

  return (
    <section className="grouped-cta">
      <div className="grouped-cta__container">
        <div className="grouped-cta__sidebar">
          <motion.div
            className="title_wrapper-group flex justify-between"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.6,
              ease: "easeOut",
            }}
          >
            <h2 className="grouped-cta__title">
              {title}
            </h2>
            <svg onClick={handleCloseButtons} className="w-7.5 h-7.5 cursor-pointer lg:hidden mt-3" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="51.2" height="51.2" viewBox="0 0 512 512">
              <image width="512" height="512" xlinkHref="data:img/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAzCAYAAAA6oTAqAAAFNUlEQVRogdVaa4hVVRT+uo2j4ahlNcygmJERSRD0MCyR3iY3g9LJRHGckCkHBa38IQQiQVFRGSGE2eNPkkNTYplUUkFNLwoKnT+VjwYzJ7VGKked0S/WsA4s99n33HPuOffRBx9zZu+119rf2Wefu/c6+xySyAhjAFwL4CYAVwCYBGACgPEARgAYAvAngEMAfgXwM4AvAXwP4GgWXchCzH0A5gGYpR1Pin8AfAygC8DbAE5WWsxIAMsBLANwWagW+A3AAQC/AzgMYADAKAAXAWgCMFFHzsVBABsBvAigP1RbDCImIVtJ9vJsnCC5leRDJK8meW4Rn3ITp5J8kORbJI85/o6QXOZpF8nISoeNJLc5QfeSXE2y2WOfhONJdpDc7fj/jOSUrMXcSfKoCdJPcqXeYZ99Gi4ledDEOklyflZi2p271amj5LPNiqNJvu7EXZNWzCrH4aMem3KyzYn/ZFSsUIHhUsdR3mNTCU4nedz04/FCMUMFypmOkBkem0rySpIDpj/3+2KHCkiOdRre5bGpBq9xbvCkOGJ2mgYrPfXV5HzTt13FxLQY4/dqTEjAjaaPq2ydXc7kABwD0KDro3Fp1kllRh+ARg1xvvZ7WECAFSpE8FgNCxG0m+u1wYUdmcO6EOzTxWCtowfAVN1ajJXFbDAyc1SI4Nn/gRDBOv1bB2Dx8JVOni6dUEMkx3gmXa3yL+3319K/nO4zZqvKHQD+Dt2D2kWn9uwGeSHk9OI8LdyWoNuNoZJsII97fUxP75vr20XMTFPwRcg8DNll7tJ9fGuoNh3yAHoB7AdwQQxPnwMY1OsZ8txt1ufuUMx50eAsK1o9NqUw7/idENNHj9p/mNP9uGBfSLcfkoC429S8kcEI5Z1HZonmEeLgF7VpFmV7VFmXR3UU3TtZ6gi5fpYkbP+8tjuQM+mhPxLeze0ZjJA7Im3qJwmCnFtDThN0KHH5sl3zZVZQR8jKjxZHyMIShMC8AOpy5p+4r0MXHwG41ZRt0JxaFFrMb4TgAQCbI+yjUKd1Q8FKWXBxRINi+NQR9FKEIJ+QLSGr+AimyXGZQN06gbo9kyspb3Em8/KI/RLjppCK8B311SP/bAneBkUaxaUr6GFtd08ZhAh/VH875Z8nTIDY2cMidAVtKpOQBpOveEUK7jBBFnsaZCUoayHCWcZvW6DulBZ0ehpkKShLIcL1xvfEoPADLZBs/khPo7SCdhTKdaVkn/b7B5rsjE3htJchaDk42/R5OEsT5ABsZkaW35emeO9XCt8CuF5jyXahP8gBnDF7/8kAFtW4kJuNkFeDr2w2OzNKR6deK+NsjqqFvebpadKM0ll5sxNmkSiJtTdrVMgzRsi6QMgwPBPzOzOxFnnqq8nbTN963X74Otbs/DZc57GpBieTHDT9uiqOGOG9ptGAfh/x2VWKTZqjCNDhixsqMFxjGv9LcprHphK83Plgu75QzFCBw6ecR67ScyjvfPja5LGJLQb6DdFiA8kRHrus+bQT94Vi/kMFBbiQ5GnjWA4zLChgm5ZzzB4lwIo4PkMFEZSXwFdOkG9021Af0S4u55H8xPG/W782x/IRKojB1fpCsJAJ+jLJufrmiePnQh0FmdD7HH9nSK71tIlkqaeaZAnxiH7BGufUnQLwk2ZI9+tHrEHNokhS/BL9BZ8CYLTTVtJdrwF4DsCeUNQiSHveTNZvCwDMdbIzSdEN4F1NN8mxrpKQ5UlAueM3ApiuZ9CCU4CyrZBROa15alnEyrkyyRHLMl5OA8qpwHQA8B8eU9d1hxi21QAAAABJRU5ErkJggg=="/>
            </svg>
          </motion.div>

          <div className="content-cta-wrapper">
            
            {/* LEFT */}
            <motion.div
              style={leftStyle}
              className={`grouped-cta__groups ${closeButtons ? "close" : ""} ${hideButtons ? "hide" : ""}`}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{
                duration: 0.6,
                ease: "easeOut",
              }}
            >
              {cta_groups?.map(
                (group, groupIndex) => (
                  <div
                    className="grouped-cta__group"
                    key={groupIndex}
                  >
                    <h3 className="grouped-cta__group-title">
                      {group.group_title}
                    </h3>

                    <div className="grouped-cta__buttons">
                      {group.buttons?.map(
                        (
                          button,
                          buttonIndex
                        ) => {
                          const isActive =
                            activeGroup ===
                              groupIndex &&
                            activeButton ===
                              buttonIndex;

                          const label =
                            button.label || "";

                          const labelWidth =
                            label.length * 10;

                          const firstLetter =
                            label.charAt(0);

                          const lastLetter =
                            label.charAt(
                              label.length - 1
                            );
                          
                          const slugTitle = label.toLowerCase().replace(/\s+/g, '-');

                          return (
                            <button
                              key={buttonIndex}
                              className={`grouped-cta__button ${isActive
                                  ? "active"
                                  : ""
                                }`}
                              onClick={() => {
                                handleChange(groupIndex, buttonIndex);

                                window.history.replaceState(
                                  {},
                                  "",
                                  `${basePath}/${slugTitle}`
                                );
                              }}
                            >
                              {/* FULL */}
                              <span className="full-text">
                                {label}
                              </span>

                              {/* ACTIVE */}
                              <span className="active-text">
                                <span>
                                  {firstLetter}
                                </span>

                                <span
                                  style={wide != null && wide >= 768 ?{
                                    width:
                                      isActive
                                        ? labelWidth
                                        : 0,
                                  } : {width: isActive ? "60px" : 0}}
                                  className="line"
                                />

                                <span>
                                  {lastLetter}
                                </span>
                              </span>
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                )
              )}
            </motion.div>

            {/* RIGHT */}
            <div className="grouped-cta__content">
              {cta_groups?.map(
                (group, groupIndex) =>
                  group.buttons?.map(
                    (button, buttonIndex) => {
                      const isActive =
                        activeGroup ===
                          groupIndex &&
                        activeButton ===
                          buttonIndex;

                      const isExit =
                        exiting?.group ===
                          groupIndex &&
                        exiting?.button ===
                          buttonIndex;

                      return (
                        <div
                          key={`${groupIndex}-${buttonIndex}`}
                          className={`grouped-cta__description
                            ${
                              isActive
                                ? "active"
                                : ""
                            }
                            ${
                              isExit
                                ? "exit"
                                : ""
                            }
                          `}
                        >
                          <PortableText
                            value={
                              button.description
                            }
                          />
                        </div>
                      );
                    }
                  )
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RichtextWithGroupedCTA;