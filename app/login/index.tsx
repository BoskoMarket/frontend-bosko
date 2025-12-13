import { View } from "react-native";
import React from "react";
import LogInView from "./LogInView";
import RegisterView from "./RegisterView";

export default function Index() {
  const [toLogin, setToLogin] = React.useState(false);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      {/* <Text style={globalStyles.title}>Bosko</Text> */}
      {toLogin ? (
        <RegisterView toLogin={() => setToLogin(!toLogin)} />
      ) : (
        <LogInView toLogin={() => setToLogin(!toLogin)} />
      )}
    </View>
  );
}

// const LoginView = () => {
//   const { login } = useAuth();
//   const [email, setEmail] = React.useState("");
//   const [password, setPassword] = React.useState("");
//   const [error, setError] = React.useState("");
//   const [isLoading, setIsLoading] = React.useState(false);

//   const handleLogin = async () => {
//     if (!email || !password) {
//       setError("Por favor completa todos los campos");
//       return;
//     }

//     setError("");
//     setIsLoading(true);

//     try {
//       const response = await login({ email, password });
//       const data = response.data;

//       if (data) {
//         router.push("/(tabs)/two");
//       }
//     } catch (error) {
//       setError("Error al iniciar sesión. Verifica tus credenciales.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <View
//       style={{
//         flex: 1,
//         justifyContent: "center",
//         alignItems: "center",
//         gap: 15,
//       }}
//     >
//       <Text style={styles.textPrincipal}>Bosko</Text>
//       <TextInput
//         placeholder="E-mail"
//         value={email}
//         placeholderTextColor={"gray"}
//         onChangeText={(text) => {
//           setEmail(text);
//           setError("");
//         }}
//         style={styles.input}
//         keyboardType="email-address"
//         autoCapitalize="none"
//       />
//       <TextInput
//         placeholder="Contraseña"
//         value={password}
//         placeholderTextColor={"gray"}
//         onChangeText={(text) => {
//           setPassword(text);
//           setError("");
//         }}
//         style={styles.input}
//         secureTextEntry
//       />
//       {error ? <Text style={styles.errorText}>{error}</Text> : null}
//       <Pressable
//         onPress={handleLogin}
//         disabled={isLoading}
//         style={({ pressed }) => [
//           styles.button,
//           { opacity: pressed || isLoading ? 0.7 : 1 },
//         ]}
//       >
//         <Text style={styles.buttonText}>
//           {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
//         </Text>
//       </Pressable>
//     </View>
//   );
// };

// const RegisterPage = () => {
//   const { register } = useAuth();
//   const [formData, setFormData] = React.useState({
//     email: "",
//     password: "",
//     userName: "",
//     fullName: "",
//   });
//   const [error, setError] = React.useState("");
//   const [isLoading, setIsLoading] = React.useState(false);

//   const handleRegister = async () => {
//     // Validar campos
//     if (
//       !formData.email ||
//       !formData.password ||
//       !formData.userName ||
//       !formData.fullName
//     ) {
//       setError("Por favor completa todos los campos");
//       return;
//     }

//     setError("");
//     setIsLoading(true);

//     try {
//       const response = await register(formData);
//       if (response.data) {
//         // Registro exitoso, redirigir al login
//         router.push("/(tabs)/two");
//       }
//     } catch (error) {
//       setError("Error al registrar usuario. Por favor intenta nuevamente.");
//       console.error("Register error:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <View
//       style={{
//         flex: 1,
//         justifyContent: "center",
//         alignItems: "center",
//         gap: 15,
//       }}
//     >
//       <Text style={styles.textPrincipal}>Registro en Bosko</Text>

//       <TextInput
//         placeholder="Nombre completo"
//         value={formData.fullName}
//         placeholderTextColor={"gray"}
//         onChangeText={(text) => {
//           setFormData((prev) => ({ ...prev, fullName: text }));
//           setError("");
//         }}
//         style={styles.input}
//         autoCapitalize="words"
//       />

//       <TextInput
//         placeholder="Nombre de usuario"
//         value={formData.userName}
//         placeholderTextColor={"gray"}
//         onChangeText={(text) => {
//           setFormData((prev) => ({ ...prev, userName: text }));
//           setError("");
//         }}
//         style={styles.input}
//         autoCapitalize="none"
//       />

//       <TextInput
//         placeholder="E-mail"
//         value={formData.email}
//         placeholderTextColor={"gray"}
//         onChangeText={(text) => {
//           setFormData((prev) => ({ ...prev, email: text }));
//           setError("");
//         }}
//         style={styles.input}
//         keyboardType="email-address"
//         autoCapitalize="none"
//       />

//       <TextInput
//         placeholder="Contraseña"
//         value={formData.password}
//         placeholderTextColor={"gray"}
//         onChangeText={(text) => {
//           setFormData((prev) => ({ ...prev, password: text }));
//           setError("");
//         }}
//         style={styles.input}
//         secureTextEntry
//       />

//       {error ? <Text style={styles.errorText}>{error}</Text> : null}

//       <Pressable
//         onPress={handleRegister}
//         disabled={isLoading}
//         style={({ pressed }) => [
//           styles.button,
//           { opacity: pressed || isLoading ? 0.7 : 1 },
//         ]}
//       >
//         <Text style={styles.buttonText}>
//           {isLoading ? "Registrando..." : "Registrarse"}
//         </Text>
//       </Pressable>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   text: {
//     fontFamily: Fonts.fonts.thin,
//     fontWeight: "200",
//     fontSize: 18,
//     color: "#000",
//     textAlign: "center",
//   },
//   textPrincipal: {
//     fontFamily: Fonts.fonts.medium,
//     fontWeight: "500",
//     fontSize: 30,
//     textAlign: "center",
//   },
//   container: {
//     width: "90%",
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 20,
//     gap: 10,
//   },
//   input: {
//     borderColor: "gray",
//     borderWidth: 2,
//     maxWidth: 200,
//     width: "100%",
//     textAlign: "center",
//     borderRadius: 10,
//     padding: 10,
//     marginVertical: 5,
//   },
//   button: {
//     backgroundColor: "#007AFF",
//     paddingVertical: 12,
//     paddingHorizontal: 30,
//     borderRadius: 10,
//     minWidth: 200,
//   },
//   buttonText: {
//     color: "white",
//     fontSize: 16,
//     fontWeight: "600",
//     textAlign: "center",
//   },
//   errorText: {
//     color: "#FF3B30",
//     fontSize: 14,
//     textAlign: "center",
//   },
// });

// const CAROUSEL_VIEWS = [<LoginView />, <WelcomeView />, <RegisterPage />];
// const data = [...new Array(CAROUSEL_VIEWS.length).keys()];
// const width = Dimensions.get("window").width;

// export default function Index() {
//   const ref = React.useRef<ICarouselInstance>(null);
//   const progress = useSharedValue<number>(1);
//   const { login } = useAuth();

//   const onPressPagination = (index: number) => {
//     ref.current?.scrollTo({
//       count: index - progress.value,
//       animated: true,
//     });
//   };

//   return (
//     <View style={{ justifyContent: "center", alignItems: "center" }}>
//       <Carousel
//         data={CAROUSEL_VIEWS}
//         loop={false}
//         renderItem={({ item }) => item}
//         width={width}
//         height={width * 1.5}
//         ref={ref}
//         style={{
//           flex: 1,
//           justifyContent: "center",
//           alignItems: "center",
//           backgroundColor: "transparent",
//         }}
//         pagingEnabled={true}
//         snapEnabled={true}
//       />
//       {/* <Pagination.Basic
//                 progress={progress}
//                 data={data}
//                 dotStyle={{ backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 50 }}
//                 containerStyle={{ gap: 5, marginTop: 10 }}
//                 onPress={onPressPagination}
//             /> */}
//     </View>
//   );
// }
