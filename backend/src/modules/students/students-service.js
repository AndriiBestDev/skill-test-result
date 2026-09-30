const { ApiError, sendAccountVerificationEmail } = require("../../utils");
const {
    findAllStudents,
    findStudentDetail,
    findStudentToSetStatus,
    addOrUpdateStudent,
    findUserIdByEmail,
    doesClassExist,
    doesSectionExist
} = require("./students-repository");
const { findUserById } = require("../../shared/repository");

const STUDENT_ROLE_ID = 3;

const checkStudentId = async (id) => {
    const user = await findUserById(id);
    if (!user || user.role_id !== STUDENT_ROLE_ID) {
        throw new ApiError(404, "Student not found");
    }
    return user;
}

const checkEmailAvailable = async (email, userId) => {
    const user = await findUserIdByEmail(email);
    if (user && String(user.id) !== String(userId)) {
        throw new ApiError(409, "Email already exists");
    }
}

const checkClassAndSection = async ({ class: className, section }) => {
    if (!(await doesClassExist(className))) {
        throw new ApiError(400, `Class '${className}' does not exist`);
    }
    if (section && !(await doesSectionExist(section))) {
        throw new ApiError(400, `Section '${section}' does not exist`);
    }
}

const normalizePayload = (payload) => ({
    ...payload,
    section: payload.section || null
});

const getAllStudents = async (payload) => {
    return findAllStudents(payload);
}

const getStudentDetail = async (id) => {
    await checkStudentId(id);

    const student = await findStudentDetail(id);
    if (!student) {
        throw new ApiError(404, "Student not found");
    }

    return student;
}

const addNewStudent = async (payload) => {
    const ADD_STUDENT_AND_EMAIL_SEND_SUCCESS = "Student added and verification email sent successfully.";
    const ADD_STUDENT_AND_BUT_EMAIL_SEND_FAIL = "Student added, but failed to send verification email.";

    await checkEmailAvailable(payload.email);
    await checkClassAndSection(payload);

    const { userId, ...data } = normalizePayload(payload);
    const result = await addOrUpdateStudent(data);
    if (!result.status) {
        throw new ApiError(500, result.message);
    }

    try {
        await sendAccountVerificationEmail({ userId: result.userId, userEmail: payload.email });
        return { id: result.userId, message: ADD_STUDENT_AND_EMAIL_SEND_SUCCESS };
    } catch (error) {
        return { id: result.userId, message: ADD_STUDENT_AND_BUT_EMAIL_SEND_FAIL };
    }
}

const updateStudent = async (payload) => {
    // student_add_update() inserts when the id is unknown, so existence must be checked first
    await checkStudentId(payload.userId);
    await checkEmailAvailable(payload.email, payload.userId);
    await checkClassAndSection(payload);

    const result = await addOrUpdateStudent(normalizePayload(payload));
    if (!result.status) {
        throw new ApiError(500, result.message);
    }

    return { message: result.message };
}

const setStudentStatus = async ({ userId, reviewerId, status }) => {
    await checkStudentId(userId);

    const affectedRow = await findStudentToSetStatus({ userId, reviewerId, status });
    if (affectedRow <= 0) {
        throw new ApiError(500, "Unable to change student status");
    }

    return { message: "Student status changed successfully" };
}

// Soft delete: the student is deactivated (is_active = false) so their history is preserved
// and login/refresh are rejected; the record can be restored via POST /:id/status.
const deleteStudent = async ({ userId, reviewerId }) => {
    await checkStudentId(userId);

    const affectedRow = await findStudentToSetStatus({ userId, reviewerId, status: false });
    if (affectedRow <= 0) {
        throw new ApiError(500, "Unable to delete student");
    }

    return { message: "Student deleted successfully" };
}

module.exports = {
    getAllStudents,
    getStudentDetail,
    addNewStudent,
    setStudentStatus,
    updateStudent,
    deleteStudent,
};
