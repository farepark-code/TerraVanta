import {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  DocumentData,
  Timestamp,
  PartialWithFieldValue,
} from 'firebase/firestore';
import type {
  ConsultantProfile,
  ClientProfile,
  Assessment,
  AuditLog,
  QuestionnaireTemplate,
  AdminProfile
} from '../../types/firestore';

export const consultantConverter: FirestoreDataConverter<ConsultantProfile> = {
  toFirestore: (data: PartialWithFieldValue<ConsultantProfile>) => {
    const { id, ...rest } = data;
    return rest as DocumentData;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
    } as ConsultantProfile;
  }
};

export const clientConverter: FirestoreDataConverter<ClientProfile> = {
  toFirestore: (data: PartialWithFieldValue<ClientProfile>) => {
    const { id, ...rest } = data;
    return rest as DocumentData;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
    } as ClientProfile;
  }
};

export const assessmentConverter: FirestoreDataConverter<Assessment> = {
  toFirestore: (data: PartialWithFieldValue<Assessment>) => {
    const { id, ...rest } = data;
    return rest as DocumentData;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data,
      submittedAt: data.submittedAt instanceof Timestamp ? data.submittedAt.toDate() : data.submittedAt,
      scoredAt: data.scoredAt instanceof Timestamp ? data.scoredAt.toDate() : data.scoredAt,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
    } as Assessment;
  }
};

export const auditLogConverter: FirestoreDataConverter<AuditLog> = {
  toFirestore: (data: PartialWithFieldValue<AuditLog>) => {
    const { id, ...rest } = data;
    return rest as DocumentData;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data,
      timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : data.timestamp,
    } as AuditLog;
  }
};

export const questionnaireTemplateConverter: FirestoreDataConverter<QuestionnaireTemplate> = {
  toFirestore: (data: PartialWithFieldValue<QuestionnaireTemplate>) => {
    const { id, ...rest } = data;
    return rest as DocumentData;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data,
    } as QuestionnaireTemplate;
  }
};

export const adminProfileConverter: FirestoreDataConverter<AdminProfile> = {
  toFirestore: (data: PartialWithFieldValue<AdminProfile>) => {
    const { id, ...rest } = data;
    return rest as DocumentData;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data,
      invitedAt: data.invitedAt instanceof Timestamp ? data.invitedAt.toDate() : data.invitedAt,
    } as AdminProfile;
  }
};
