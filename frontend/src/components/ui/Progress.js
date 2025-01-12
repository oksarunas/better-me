import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";

export const Progress = ({ value, className }) => (
  <div className={classNames("relative w-full h-2 bg-gray-200 rounded", className)}>
    <div
      className="absolute top-0 left-0 h-full bg-blue-600 rounded transition-all duration-300"
      style={{ width: `${value}%` }}
    ></div>
  </div>
);

Progress.propTypes = {
  value: PropTypes.number.isRequired,
  className: PropTypes.string,
};
