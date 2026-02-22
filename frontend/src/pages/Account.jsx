import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Account() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to profile tab by default
    navigate('/account/profile');
  }, [navigate]);

  return null;
}