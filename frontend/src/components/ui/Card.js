import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";

export const Card = ({ children, className }) => {
  return (
    <div
      className={classNames(
        "rounded-lg shadow-md bg-white dark:bg-gray-800",
        className
      )}
    >
      {children}
    </div>
  );
};

export const CardContent = ({ children, className }) => {
  return (
    <div className={classNames("p-4", className)}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className }) => {
  return (
    <div className={classNames("p-4 border-b border-gray-200 dark:border-gray-700", className)}>
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className }) => {
  return (
    <h2 className={classNames("text-lg font-semibold", className)}>{children}</h2>
  );
};

// Prop types for validation
Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

CardContent.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

CardHeader.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

CardTitle.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};
