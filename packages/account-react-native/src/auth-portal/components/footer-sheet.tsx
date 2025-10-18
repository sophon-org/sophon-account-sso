import { Image, StyleSheet, Text, View } from "react-native";
import React from "react";

type FooterSheetProps = {
  hideTerms?: boolean;
};

export function FooterSheet(props: FooterSheetProps) {
  return (
    <View style={styles.container}>
      <TermsAndPrivacy {...props} />
      <View style={styles.row}>
        <Text style={styles.footerText}>Powered by</Text>
        <Image source={require("../../assets/images/sophon-logo.png")} />
      </View>
    </View>
  );
}

function TermsAndPrivacy(props: FooterSheetProps) {
  if (props?.hideTerms) return null;
  return (
    <View>
      <Text style={styles.footerText}>
        {`By logging in you are accepting our\n`}
        <Text style={styles.link}> Terms of Use </Text>
        and
        <Text style={styles.link}> Privacy Policy</Text>.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footerText: {
    textAlign: "center",
    color: "#999",
    fontSize: 12,
    lineHeight: 24,
  },
  container: {
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  link: {
    color: "#0066FF",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
