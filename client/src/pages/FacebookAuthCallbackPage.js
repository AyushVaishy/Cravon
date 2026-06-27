import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { setCredentials } from "../store/authSlice";

const ROLE_REDIRECT = {
  USER: "/home",
  RESTAURANT_OWNER: "/owner",
  ADMIN: "/admin",
};

const FacebookAuthCallbackPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      toast.error("Facebook sign-in failed. Please try again.");
      navigate("/", { replace: true });
      return;
    }

    const accessToken = searchParams.get("accessToken");
    const userRaw = searchParams.get("user");
    const newOwner = searchParams.get("newOwner") === "1";

    if (!accessToken || !userRaw) {
      toast.error("Facebook sign-in incomplete. Please try again.");
      navigate("/", { replace: true });
      return;
    }

    try {
      const user = JSON.parse(userRaw);
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("userData", JSON.stringify(user));
      dispatch(setCredentials({ user, accessToken }));

      toast.success(`Welcome${user.name ? `, ${user.name}` : ""}!`);

      if (newOwner && user.role === "RESTAURANT_OWNER") {
        navigate("/owner/onboard", { replace: true });
      } else {
        navigate(ROLE_REDIRECT[user.role] || "/home", { replace: true });
      }
    } catch {
      toast.error("Facebook sign-in failed. Please try again.");
      navigate("/", { replace: true });
    }
  }, [dispatch, navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin h-10 w-10 border-b-2 border-primary rounded-full mx-auto mb-4" />
        <p className="text-muted-foreground font-medium">Completing Facebook sign-in…</p>
      </div>
    </div>
  );
};

export default FacebookAuthCallbackPage;
