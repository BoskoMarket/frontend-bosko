// import React from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   StyleSheet,
//   KeyboardAvoidingView,
//   Platform,
//   TouchableWithoutFeedback,
//   Keyboard,
// } from "react-native";
// import { useSharedValue } from "react-native-reanimated";
// import Carousel, {
//   ICarouselInstance,
//   Pagination,
// } from "react-native-reanimated-carousel";
// import { router } from "expo-router";
// import ButtonBosko from "@/components/ButtonBosko";
// import Colors from "@/constants/Colors";
// import { Image } from "expo-image";
// import { useAuth } from "@/context/AuthContext";

// export default function OnboardingRegister({
//   toLogin,
// }: {
//   toLogin: () => void;
// }) {
//   const { register } = useAuth();
//   const ref = React.useRef<ICarouselInstance>(null);
//   const progress = useSharedValue<number>(0);
//   const [currentIndex, setCurrentIndex] = React.useState(0);

//   type FormField =
//     | "password"
//     | "email"
//     | "firstName"
//     | "lastName"
//     | "userName"
//     | "phone"
//     | "location";

//   type RegisterFormData = {
//     password: string;
//     email: string;
//     firstName: string;
//     lastName: string;
//     userName: string;
//     phone: string;
//     location: string;
//   };

//   const [formData, setFormData] = React.useState<RegisterFormData>({
//     password: "",
//     email: "",
//     firstName: "",
//     lastName: "",
//     userName: "",
//     phone: "",
//     location: "",
//   });

//   const steps: { label: string; field: FormField }[] = [
//     { label: "Correo electrónico", field: "email" },
//     { label: "Contraseña", field: "password" },
//     { label: "Nombre", field: "firstName" },
//     { label: "Apellido", field: "lastName" },
//     { label: "Nombre de usuario", field: "userName" },
//     { label: "Teléfono", field: "phone" },
//     { label: "Ubicación", field: "location" },
//   ];

//   const onPressPagination = (index: number) => {
//     ref.current?.scrollTo({
//       count: index - progress.value,
//       animated: true,
//     });
//   };

//   const handleFinish = async () => {
//     const response = await register(formData);

//     if (response.data) {
//       // Registro exitoso, redirigir al login
//       router.push("/(tabs)");
//     } else {
//       console.error("Error al registrar usuario");
//     }
//     // router.push("/confirmar-registro");
//   };

//   return (
//     <TouchableWithoutFeedback
//       onPress={() => {
//         // Dismiss keyboard on press outside of input
//         Keyboard.dismiss();
//       }}
//       style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
//     >
//       <KeyboardAvoidingView
//         style={styles.container}
//         behavior={Platform.OS === "ios" ? "padding" : undefined}
//       >
//         <Image
//           source={require("@/assets/images/bosko-logo.png")}
//           style={{ width: 200, height: 200, marginBottom: 20 }}
//           contentFit="contain"
//         />
//         <Carousel
//           loop={false}
//           width={350}
//           height={300}
//           autoPlay={false}
//           ref={ref}
//           data={steps}
//           renderItem={({ item }) => (
//             <View style={styles.stepContainer}>
//               <Text style={styles.title}>{item.label}</Text>
//               <TextInput
//                 style={styles.input}
//                 placeholder={item.label}
//                 value={formData[item.field]}
//                 onChangeText={(text) =>
//                   setFormData({ ...formData, [item.field]: text })
//                 }
//                 keyboardType={
//                   item.field === "email"
//                     ? "email-address"
//                     : item.field === "phone"
//                     ? "phone-pad"
//                     : "default"
//                 }
//                 autoCapitalize="none"
//               />
//             </View>
//           )}
//           onProgressChange={(offsetProgress, absoluteProgress) => {
//             progress.value = absoluteProgress;
//             setCurrentIndex(Math.round(absoluteProgress));
//           }}
//         />

//         <Pagination.Basic
//           progress={progress}
//           data={steps}
//           size={20}
//           dotStyle={{
//             width: 30,
//             borderRadius: 30,
//             backgroundColor: "transparent",
//           }}
//           activeDotStyle={{
//             borderRadius: 20,
//             overflow: "hidden",
//             backgroundColor: Colors.colorPrimary,
//           }}
//           containerStyle={{ marginBottom: 20 }}
//           horizontal
//           onPress={onPressPagination}
//         />

//         {currentIndex === steps.length - 1 ? (
//           <ButtonBosko title="Finalizar Registro" onPress={handleFinish} />
//         ) : (
//           <ButtonBosko
//             title="Siguiente"
//             onPress={() => ref.current?.scrollTo({ count: 1, animated: true })}
//           />
//         )}
//       </KeyboardAvoidingView>
//     </TouchableWithoutFeedback>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   stepContainer: {
//     alignItems: "center",
//     justifyContent: "center",
//     paddingHorizontal: 20,
//   },
//   title: {
//     fontSize: 22,
//     fontWeight: "600",
//     marginBottom: 10,
//     textAlign: "center",
//   },
//   input: {
//     borderColor: "#ccc",
//     borderWidth: 1,
//     borderRadius: 10,
//     width: "100%",
//     padding: 15,
//     fontSize: 16,
//     backgroundColor: "#fff",
//   },
// });
