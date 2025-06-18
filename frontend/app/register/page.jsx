"use client";
import React, { useEffect } from "react";

const Register = () => {
  const username = "yasser.barek";
  useEffect(() => {
    const registerUser = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/register`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: username,
              email: username + "@naftal.dz",
              password: "Test202531",
              role: "administrateur", // Change role if needed
            }),
          }
        );

        if (!response.ok) {
          // Handle errors (like 400, 500)
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to register user");
        }

        const data = await response.json();
        console.log("User registered:", data);
      } catch (error) {
        console.error("Error registering user:", error);
      }
    };

    // Automatically call the registration function on component mount
    registerUser();
  }, []);

  return (
    <div>
      <h1>Register Page</h1>
      <p>Registering user automatically...</p>
    </div>
  );
};

export default Register;
