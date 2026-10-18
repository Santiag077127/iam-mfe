import { useEffect, useState } from "react";
import type { FC } from "react";
import { AuthLayout } from "./adapter/in/components/AuthLayout";
import { ConfirmPasswordScreen } from "./adapter/in/pages/ConfirmPasswordScreen";
import { LoginScreen } from "./adapter/in/pages/LoginScreen";
import { RbacPermissionsPage } from "./adapter/in/pages/RbacPermissionsPage";
import { RequestPasswordResetScreen } from "./adapter/in/pages/RequestPasswordResetScreen";
import { getInitialScreen, getRouteMessage, updateBrowserRoute } from "./adapter/in/routes";
import { Notice, Screen } from "./adapter/in/types";
import type { RbacCatalogPort } from "./application/ports/RbacCatalogPort";
import type { UserAdministrationPort } from "./application/ports/UserAdministrationPort";
import type { IamMfeProps } from "./contracts/remote-props";
import { UsersPage } from "./adapter/in/pages/UsersPage";
import userPageStyles from "./adapter/in/pages/UsersPage.module.css";
import "./styles.css";

export const App: FC<IamMfeProps> = ({
  userAdministration,
  canManageUsers = false,
  rbacCatalog,
  canViewRoleConfig = false
}) => {
  const demoMode =
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).get("demo") === "true";
  const rbacDemoMode =
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).get("demo") === "rbac";

  const [screen, setScreen] = useState<Screen>(() =>
    demoMode ? "users" : rbacDemoMode ? "rbac" : getInitialScreen()
  );
  const [notice, setNotice] = useState<Notice>(null);
  const [demoAdministration, setDemoAdministration] =
    useState<UserAdministrationPort>();
  const [demoLoadFailed, setDemoLoadFailed] = useState(false);
  const [demoRbacCatalog, setDemoRbacCatalog] = useState<RbacCatalogPort>();
  const [demoRbacLoadFailed, setDemoRbacLoadFailed] = useState(false);

  const loginMessage = getRouteMessage();

  useEffect(() => {
    if (!demoMode) return;

    let cancelled = false;

    void import("./adapter/out/demoUserAdministration")
      .then(({ createDemoUserAdministration }) => {
        if (!cancelled) {
          setDemoAdministration(createDemoUserAdministration());
        }
      })
      .catch(() => {
        if (!cancelled) setDemoLoadFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [demoMode]);

  useEffect(() => {
    if (!rbacDemoMode) return;

    let cancelled = false;

    void import("./adapter/out/demoRbacCatalog")
      .then(({ createDemoRbacCatalog }) => {
        if (!cancelled) {
          setDemoRbacCatalog(createDemoRbacCatalog());
        }
      })
      .catch(() => {
        if (!cancelled) setDemoRbacLoadFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [rbacDemoMode]);

  const activeUserAdministration = demoMode
    ? demoAdministration
    : userAdministration;

  const canManageCurrentUsers = demoMode || canManageUsers;
  const activeRbacCatalog = rbacDemoMode ? demoRbacCatalog : rbacCatalog;
  const canViewCurrentRoleConfig = rbacDemoMode || canViewRoleConfig;

  function navigate(nextScreen: Screen, token?: string) {
    setNotice(null);
    setScreen(nextScreen);
    updateBrowserRoute(nextScreen, token);
  }

  function handlePasswordChanged() {
    setNotice({ kind: "success", message: "Contraseña actualizada correctamente." });
    setScreen("login");
    updateBrowserRoute("login");
  }

  if (screen === "users") {
    if (!canManageCurrentUsers) {
      return (
        <main className={userPageStyles.accessDenied} data-mfe="iam" role="alert">
          <h1>Acceso no autorizado</h1>
          <p>
            {"El shell debe validar el permiso de administraci\u00f3n de usuarios antes de montar esta pantalla."}
          </p>
        </main>
      );
    }

    if (demoMode && !activeUserAdministration) {
      return (
        <main role={demoLoadFailed ? "alert" : "status"}>
          {demoLoadFailed
            ? "No se pudo cargar la demo de usuarios."
            : demoMode
              ? "Cargando demo de usuarios..."
              : "La administraci\u00f3n de usuarios no recibi\u00f3 el servicio requerido."}
        </main>
      );
    }

    return <UsersPage api={activeUserAdministration} />;
  }

  if (screen === "rbac") {
    if (!canViewCurrentRoleConfig) {
      return (
        <main
          className={userPageStyles.accessDenied}
          data-mfe="iam"
          role="alert"
        >
          <h1>Acceso no autorizado</h1>
          <p>
            El shell debe validar el permiso IDENTITY_ROLE_VIEW antes de mostrar
            la parametrización RBAC.
          </p>
        </main>
      );
    }

    if (rbacDemoMode && !activeRbacCatalog) {
      return (
        <main role={demoRbacLoadFailed ? "alert" : "status"}>
          {demoRbacLoadFailed
            ? "No se pudo cargar la demo RBAC."
            : "Cargando demo RBAC…"}
        </main>
      );
    }

    if (!activeRbacCatalog) {
      return (
        <main data-mfe="iam" role="alert">
          <h1>Servicio RBAC no disponible</h1>
          <p>
            El shell autorizó la consulta, pero no inyectó el cliente autenticado
            requerido para cargar los datos.
          </p>
        </main>
      );
    }

    return (
      <RbacPermissionsPage
        api={activeRbacCatalog}
        demoMode={rbacDemoMode}
      />
    );
  }

  return (
    <AuthLayout screen={screen}>
      {screen === "login" ? (
        <LoginScreen
          initialNotice={loginMessage ? { kind: "success", message: loginMessage } : notice}
          onNotice={setNotice}
          onForgotPassword={() => navigate("request")}
          onTemporaryPassword={(token) => navigate("confirm", token)}
        />
      ) : screen === "request" ? (
        <RequestPasswordResetScreen
          notice={notice}
          onNotice={setNotice}
          onBackToLogin={() => navigate("login")}
        />
      ) : (
        <ConfirmPasswordScreen
          notice={notice}
          onNotice={setNotice}
          onRequestNew={() => navigate("request")}
          onPasswordChanged={handlePasswordChanged}
        />
      )}
    </AuthLayout>
  );
};

export default App;
