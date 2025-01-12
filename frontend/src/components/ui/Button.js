import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";

export const Button = ({ children, size = "md", asChild = false, className, ...props }) => {
  const Component = asChild ? "span" : "button";

  return (
    <Component
      className={classNames(
        "inline-flex items-center justify-center rounded-lg font-medium transition",
        {
          "text-sm px-3 py-2": size === "sm",
          "text-base px-4 py-2": size === "md",
          "text-lg px-5 py-3": size === "lg",
        },
        "bg-primary text-white hover:bg-primary-dark dark:bg-blue-600 dark:hover:bg-blue-700",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};

// Prop types for validation
Button.propTypes = {
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  asChild: PropTypes.bool,
  className: PropTypes.string,
};
