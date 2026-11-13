let services;
let initialization;

async function initializeServices() {
  let config;
  try {
    config = (await import('./firebase-config.js')).default;
  } catch {
    throw new Error('O multiplayer ainda precisa ser configurado neste projeto. Você pode jogar contra a IA.');
  }
  if (!config?.projectId || !config?.apiKey || config.projectId.includes('SEU_')) {
    throw new Error('A configuração do multiplayer está incompleta. Confira os dados do projeto Firebase.');
  }

  const [appSDK, authSDK, firestoreSDK, functionsSDK] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js'),
    import('https://www.gstatic.com/firebasejs/12.6.0/firebase-functions.js'),
  ]);
  const app = appSDK.getApps().length ? appSDK.getApp() : appSDK.initializeApp(config);
  const auth = authSDK.getAuth(app);
  const db = firestoreSDK.getFirestore(app);
  const functions = functionsSDK.getFunctions(app, 'southamerica-east1');
  await auth.authStateReady();
  if (!auth.currentUser) await authSDK.signInAnonymously(auth);
  return {
    uid: auth.currentUser.uid,
    db,
    ...firestoreSDK,
    async call(action, payload = {}) {
      const result = await functionsSDK.httpsCallable(functions, 'game')({ action, ...payload });
      return result.data;
    },
  };
}

async function init() {
  if (services) return services;
  if (!initialization) {
    initialization = initializeServices().catch(error => {
      initialization = null;
      throw error;
    });
  }
  services = await initialization;
  return services;
}

export async function connectOnline() {
  const service = await init();
  let unsubscribe = () => {};
  let heartbeatTimer;
  let alive = true;
  let lastBattle = null;
  const client = {
    code: null,
    call: service.call,
    action(action, data = {}) {
      return service.call(action, { code: client.code, ...data });
    },
    close() {
      alive = false;
      unsubscribe();
      clearInterval(heartbeatTimer);
    },
    listen(code, color, receive, status) {
      client.code = code;
      let latest = null;
      let event = null;
      function emit() {
        if (latest && alive) {
          receive({ ...latest, event: event?.expiresAt > Date.now() ? event : null });
        }
      }
      unsubscribe = service.onSnapshot(
        service.doc(service.db, 'rooms', code, 'views', service.uid),
        async snapshot => {
          if (!snapshot.exists() || !alive) return;
          latest = snapshot.data();
          const battleId = latest.battleId;
          if (battleId !== lastBattle) {
            lastBattle = battleId;
            event = null;
            if (battleId) {
              try {
                const battle = await service.getDoc(service.doc(service.db, 'rooms', code, 'battles', String(battleId)));
                if (latest.battleId === battleId) event = battle.exists() ? battle.data().event : null;
              } catch {
                // Expired confrontation documents are intentionally unreadable.
              }
            }
          }
          emit();
          if (alive) status(navigator.onLine ? 'Online · sessão sincronizada' : 'Sem conexão · reconectando');
        },
        error => { if (alive) status(`Falha de sincronização · ${error.message}`); },
      );
      async function heartbeat() {
        try {
          const result = await client.action('heartbeat');
          if (!alive) return;
          if (latest) {
            latest = { ...latest, connected: result.connected };
            emit();
          }
          status('Online · sessão sincronizada');
        } catch {
          if (alive) status('Sem conexão · tentando reconectar');
        }
      }
      heartbeat();
      heartbeatTimer = setInterval(heartbeat, 15000);
    },
  };
  return client;
}
