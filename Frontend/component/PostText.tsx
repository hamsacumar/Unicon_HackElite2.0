// components/PostText.tsx

import React from "react";
import { Text, Linking } from "react-native";
import Hyperlink from "react-native-hyperlink";

type PostTextProps = {
    content: string;
    style?: any;
};

const PostText: React.FC<PostTextProps> = ({ content }) => {
  return (
    <Hyperlink
      linkStyle={{ color: "#2980b9", textDecorationLine: "underline" }}
      onPress={(url) => Linking.openURL(url)}
    >
      <Text style={{ fontSize: 16, lineHeight: 24 }}>{content}</Text>
    </Hyperlink>
  );
};

export default PostText;
