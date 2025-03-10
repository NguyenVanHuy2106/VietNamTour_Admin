import React from "react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header style={styles.header}>
      <h1 style={styles.logo}>Admin Dashboard</h1>
      <nav>
        <Link to="/" style={styles.link}>
          Home
        </Link>
        <Link to="/users" style={styles.link}>
          Users
        </Link>
        <Link to="/about" style={styles.link}>
          About
        </Link>
      </nav>
    </header>
  );
};

const styles = {
  header: {
    padding: "10px 20px",
    backgroundColor: "#333",
    color: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    margin: 0,
  },
  link: {
    color: "#fff",
    margin: "0 10px",
    textDecoration: "none",
  },
};

export default Header;
