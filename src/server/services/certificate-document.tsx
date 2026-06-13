import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import { signatureInitials } from "@/lib/certificate";

export type CertificateData = {
  studentName: string;
  courseName: string;
  certificateNumber: string;
  instructorName: string;
};

// Theme navy (matches the app's --primary) for headings + the page border.
const NAVY = "#0a0a23";
const MUTED = "#52525b";
const BORDER = "#d4d4d8";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    paddingVertical: 48,
    paddingHorizontal: 64,
    fontFamily: "Helvetica",
  },
  // Thin navy frame around the whole certificate.
  frame: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 6,
    paddingVertical: 40,
    paddingHorizontal: 56,
    alignItems: "center",
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
  },
  title: {
    fontFamily: "Helvetica-Bold",
    fontSize: 30,
    color: NAVY,
    letterSpacing: 1,
  },
  certNumber: {
    marginTop: 8,
    fontSize: 11,
    color: MUTED,
    letterSpacing: 1,
  },
  body: {
    alignItems: "center",
    marginTop: 12,
  },
  awardedTo: {
    fontSize: 12,
    color: MUTED,
    marginBottom: 10,
  },
  studentName: {
    fontFamily: "Times-BoldItalic",
    fontSize: 26,
    color: NAVY,
  },
  completionLine: {
    fontFamily: "Times-Italic",
    fontSize: 14,
    color: "#3f3f46",
    marginTop: 14,
    textAlign: "center",
  },
  signatureBlock: {
    alignItems: "center",
    width: 220,
  },
  signatureMark: {
    fontFamily: "Times-Italic",
    fontSize: 28,
    color: NAVY,
    marginBottom: 6,
  },
  signatureLine: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: NAVY,
    paddingTop: 6,
    alignItems: "center",
  },
  instructorName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: NAVY,
  },
  instructorRole: {
    fontSize: 10,
    color: MUTED,
    marginTop: 2,
  },
});

/**
 * Landscape A4 certificate of completion. Deterministic from its props — no
 * dates, randomness, or sensitive data are embedded (the certificate number is
 * the only identifier).
 */
export function CertificateDocument({
  studentName,
  courseName,
  certificateNumber,
  instructorName,
}: CertificateData) {
  const initials = signatureInitials(instructorName);

  return (
    <Document title="Certificate of Completion">
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.frame}>
          <View style={styles.header}>
            <Text style={styles.title}>Certificate of Completion</Text>
            <Text style={styles.certNumber}>{certificateNumber}</Text>
          </View>

          <View style={styles.body}>
            <Text style={styles.awardedTo}>Diberikan kepada</Text>
            <Text style={styles.studentName}>{studentName}</Text>
            <Text style={styles.completionLine}>
              Telah menyelesaikan course {courseName}
            </Text>
          </View>

          <View style={styles.signatureBlock}>
            <Text style={styles.signatureMark}>{initials}</Text>
            <View style={styles.signatureLine}>
              <Text style={styles.instructorName}>{instructorName}</Text>
              <Text style={styles.instructorRole}>Instructor</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
