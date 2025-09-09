// // screens/InboxScreen.tsx
// import React, { useEffect, useState } from "react";
// import { View, FlatList, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
// import { getInbox, Message } from "../services/api/api";
// import { NativeStackScreenProps } from "@react-navigation/native-stack";
// import { RootStackParamList } from "../App";

// type Props = NativeStackScreenProps<RootStackParamList, "InboxScreen">;

// const InboxScreen: React.FC<Props> = ({ navigation }) => {
//   const [inbox, setInbox] = useState<Message[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const fetchInbox = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const inboxData = await getInbox(); // no userId needed
//       setInbox(inboxData);
//     } catch (err: any) {
//       console.error(err);
//       setError(err.message || "Failed to fetch inbox.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchInbox();
//     const interval = setInterval(fetchInbox, 3000); // auto-refresh every 3 seconds
//     return () => clearInterval(interval);
//   }, []);

//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color="#007AFF" />
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View style={styles.center}>
//         <Text style={styles.errorText}>{error}</Text>
//         <TouchableOpacity onPress={fetchInbox} style={styles.retryButton}>
//           <Text style={{ color: "#fff" }}>Retry</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       {inbox.length === 0 ? (
//         <View style={styles.center}>
//           <Text>No messages yet</Text>
//         </View>
//       ) : (
//         <FlatList
//           data={inbox}
//           keyExtractor={(item) => item.id}
//           renderItem={({ item }) => (
//             <TouchableOpacity
//               onPress={() =>
//                 navigation.navigate("Chat", {
//                   otherUserId: item.senderId,
//                   otherUsername: item.senderUsername,
//                 })
//               }
//               style={[styles.messageContainer, item.status === "unseen" && styles.unseenMessage]}
//             >
//               <Text style={[styles.sender, item.status === "unseen" && styles.unseenText]}>
//                 {item.senderUsername}
//               </Text>
//               <Text numberOfLines={1} ellipsizeMode="tail" style={styles.messageText}>
//                 {item.text}
//               </Text>
//               <Text style={styles.timestamp}>
//                 {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
//               </Text>
//             </TouchableOpacity>
//           )}
//         />
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 10 },
//   center: { flex: 1, justifyContent: "center", alignItems: "center" },
//   messageContainer: {
//     backgroundColor: "#fff",
//     padding: 12,
//     marginBottom: 10,
//     borderRadius: 8,
//     elevation: 2,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   unseenMessage: {
//     borderLeftWidth: 4,
//     borderLeftColor: "#007AFF",
//     paddingLeft: 8,
//   },
//   sender: { fontWeight: "600", fontSize: 16, marginBottom: 4 },
//   unseenText: { fontWeight: "bold" },
//   messageText: { color: "#666" },
//   timestamp: { fontSize: 12, color: "#999", alignSelf: "flex-end" },
//   errorText: { color: "red", marginBottom: 10, textAlign: "center" },
//   retryButton: {
//     backgroundColor: "#007AFF",
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 8,
//   },
// });

// export default InboxScreen;
