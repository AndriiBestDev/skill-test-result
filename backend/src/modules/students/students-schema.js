const { z } = require("zod");

const idParams = z.object({
    id: z.coerce.number({ invalid_type_error: "Student id must be a number" }).int().positive("Student id must be a positive integer")
});

const dateString = (field) =>
    z.string({ required_error: `${field} is required` })
        .refine((value) => !isNaN(Date.parse(value)), `${field} must be a valid date`);

const requiredString = (field) =>
    z.string({ required_error: `${field} is required` }).trim().min(1, `${field} is required`);

const studentBody = z.object({
    name: requiredString("Name"),
    email: requiredString("Email").email("Email must be valid"),
    gender: requiredString("Gender"),
    phone: requiredString("Phone"),
    dob: dateString("Date of birth"),
    class: requiredString("Class"),
    section: z.string().optional(),
    roll: z.coerce.number({ invalid_type_error: "Roll must be a number" }).int().positive("Roll must be a positive integer"),
    admissionDate: dateString("Admission date"),
    currentAddress: requiredString("Current address"),
    permanentAddress: requiredString("Permanent address"),
    fatherName: requiredString("Father name"),
    fatherPhone: z.string().optional(),
    motherName: z.string().optional(),
    motherPhone: z.string().optional(),
    guardianName: requiredString("Guardian name"),
    guardianPhone: requiredString("Guardian phone"),
    relationOfGuardian: requiredString("Relation of guardian"),
    systemAccess: z.boolean().optional()
});

const GetStudentsSchema = z.object({
    query: z.object({
        name: z.string().optional(),
        class: z.string().optional(),
        className: z.string().optional(),
        section: z.string().optional(),
        roll: z.coerce.number({ invalid_type_error: "Roll must be a number" }).int().positive("Roll must be a positive integer").optional()
    })
});

const StudentIdSchema = z.object({
    params: idParams
});

const AddStudentSchema = z.object({
    body: studentBody
});

const UpdateStudentSchema = z.object({
    params: idParams,
    body: studentBody.extend({
        systemAccess: z.boolean({ required_error: "System access is required" })
    })
});

const StudentStatusSchema = z.object({
    params: idParams,
    body: z.object({
        status: z.boolean({ required_error: "Status is required" })
    })
});

module.exports = {
    GetStudentsSchema,
    StudentIdSchema,
    AddStudentSchema,
    UpdateStudentSchema,
    StudentStatusSchema
};
