import { Component, OnInit } from '@angular/core';
import { User } from '../models/user.model';
import { Subject } from 'rxjs';
import { FormBuilder, FormGroup, Validators, FormArray, ValidatorFn, AbstractControl, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatStepper } from '@angular/material/stepper';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import * as _moment from 'moment';
// tslint:disable-next-line:no-duplicate-imports
import { defaultFormat as _rollupMoment } from 'moment';
import { MatSnackBar, MatDialog, MatDialogConfig } from '@angular/material';

import { SignPadDialog } from '../sign-dialog/sign-dialog.component';
import { SummaryOfBenefitsDialog } from '../summary-of-benefits/summary-of-benefits.component';
import { CancelApplicationDialog } from '../shared/cancel-dialog/cancel-dialog.component';
import { JusticeApplicationDataService } from '../services/justice-application-data.service';
import { FormBase } from '../shared/form-base';
import { HOSPITALS } from '../shared/hospital-list';
import { EnumHelper, ApplicationType } from '../shared/enums-list';
import { MY_FORMATS } from '../shared/enums-list';
import { Application, Introduction, PersonalInformation, CrimeInformation, MedicalInformation, ExpenseInformation, EmploymentIncomeInformation, RepresentativeInformation, DeclarationInformation, AuthorizationInformation, VictimInformation } from '../interfaces/application.interface';
import { FileBundle } from '../models/file-bundle';
import { COUNTRIES_ADDRESS } from '../shared/address/country-list';
import { REPRESENTATIVE_LIST } from '../constants/representative-list';
import { CrimeInfoHelper } from '../shared/crime-information/crime-information.helper';
import { MedicalInfoHelper } from '../shared/medical-information/medical-information.helper';
import { AuthInfoHelper } from '../shared/authorization-information/authorization-information.helper';
import { POSTAL_CODE } from '../shared/regex.constants';
import { VictimInfoHelper } from '../shared/victim-information/victim-information.helper';
import { PersonalInfoHelper } from '../shared/personal-information/personal-information.helper';
import { RepresentativeInfoHelper } from '../shared/representative-information/representative-information.helper';

const moment = _rollupMoment || _moment;

// export const postalRegex = '(^\\d{5}([\-]\\d{4})?$)|(^[A-Za-z][0-9][A-Za-z]\\s?[0-9][A-Za-z][0-9]$)';

@Component({
  selector: 'app-ifm-application',
  templateUrl: './ifm-application.component.html',
  styleUrls: ['./ifm-application.component.scss'],
  providers: [
    // `MomentDateAdapter` can be automatically provided by importing `MomentDateModule` in your
    // application's root module. We provide it at the component level here, due to limitations of
    // our example generation script.
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})

export class IfmApplicationComponent extends FormBase implements OnInit {
  FORM_TYPE = ApplicationType.IFM_Application;
  postalRegex = POSTAL_CODE;
  currentUser: User;
  dataLoaded = false;
  busy: Promise<any>;
  busy2: Promise<any>;
  busy3: Promise<any>;
  form: FormGroup;
  formFullyValidated: boolean;
  showValidationMessage: boolean;
  submitting: boolean = false; // this controls the button state for

  otherTreatmentItems: FormArray;
  employerItems: FormArray;
  courtFileItems: FormArray;
  crimeLocationItems: FormArray;
  policeReportItems: FormArray;
  authorizedPersons: FormArray;

  hospitalList = HOSPITALS;
  provinceList: string[];
  relationshipList: string[];
  enumHelper = new EnumHelper();

  public currentFormStep: number;

  saveFormData: any;

  todaysDate = new Date(); // for the birthdate validation
  oldestHuman = new Date(this.todaysDate.getFullYear() - 120, this.todaysDate.getMonth(), this.todaysDate.getDay());

  get preferredMethodOfContact() { return this.form.get('personalInformation.preferredMethodOfContact'); }

  ApplicationType = ApplicationType;

  personalInfoHelper = new PersonalInfoHelper();
  victimInfoHelper = new VictimInfoHelper();
  crimeInfoHelper = new CrimeInfoHelper();
  medicalInfoHelper = new MedicalInfoHelper();
  representativeInfoHelper = new RepresentativeInfoHelper();
  authInfoHelper = new AuthInfoHelper();

  constructor(
    private justiceDataService: JusticeApplicationDataService,
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    public snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) {
    super();
    var canada = COUNTRIES_ADDRESS.filter(c => c.name.toLowerCase() == 'canada')[0];
    this.provinceList = canada.areas;
    this.relationshipList = REPRESENTATIVE_LIST.name;

    this.formFullyValidated = false;
    this.currentFormStep = 0;
  }

  ngOnInit() {
    let completeOnBehalfOf = this.route.snapshot.queryParamMap.get('ob');
    this.form = this.buildApplicationForm();

    this.form.get('representativeInformation').patchValue({
      completingOnBehalfOf: parseInt(completeOnBehalfOf)
    });

    // this.form.get('representativeInformation.representativePreferredMethodOfContact').valueChanges.subscribe(() => this.setRequiredFields());
  }

  showSignPad(group, control): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    const dialogRef = this.dialog.open(SignPadDialog, dialogConfig);
    dialogRef.afterClosed().subscribe(
      data => {
        var patchObject = {};
        patchObject[control] = data;
        this.form.get(group).patchValue(
          patchObject
        );
      }
    );
  }

  verifyCancellation(): void {
    const verifyDialogConfig = new MatDialogConfig();
    verifyDialogConfig.disableClose = true;
    verifyDialogConfig.autoFocus = true;
    verifyDialogConfig.data = 'witness';

    const verifyDialogRef = this.dialog.open(CancelApplicationDialog, verifyDialogConfig);
    verifyDialogRef.afterClosed().subscribe(
      data => {
        if (data === true) {
          this.router.navigate(['/application-cancelled']);
          return;
        }
      }
    );
  }

  showSummaryOfBenefits(): void {
    const summaryDialogRef = this.dialog.open(SummaryOfBenefitsDialog, { maxWidth: '800px !important', data: 'ifm' });
  }

  getFormGroupName(groupIndex: any) {
    let elements: Array<string> = ['introduction', 'personalInformation', 'victimInformation', 'crimeInformation', 'medicalInformation', 'expenseInformation', 'representativeInformation', 'declarationInformation', 'authorizationInformation'];
    return elements[groupIndex];
  }

  gotoPageIndex(stepper: MatStepper, selectPage: number): void {
    window.scroll(0, 0);
    stepper.selectedIndex = selectPage;
    this.currentFormStep = selectPage;
  }

  gotoPage(selectPage: MatStepper): void {
    window.scroll(0, 0);
    this.showValidationMessage = false;
    this.currentFormStep = selectPage.selectedIndex;
  }

  gotoNextStep(stepper: MatStepper): void {
    if (stepper != null) {
      var desiredFormIndex = stepper.selectedIndex;
      var formGroupName = this.getFormGroupName(desiredFormIndex);

      this.formFullyValidated = this.form.valid;

      if (desiredFormIndex >= 0 && desiredFormIndex < 9) {
        var formParts = this.form.get(formGroupName);
        var formValid = true;

        if (formParts != null) {
          formValid = formParts.valid;
        }

        if (formValid) {
          this.showValidationMessage = false;
          window.scroll(0, 0);
          stepper.next();
        } else {
          this.validateAllFormFields(formParts);
          this.showValidationMessage = true;
        }
      }
    }
  }

  createEmployerItem(): FormGroup {
    return this.fb.group({
      employerName: [''],//, Validators.required],
      employerPhoneNumber: [''],//, Validators.required],
      employerFirstName: [''],
      employerLastName: [''],
      employerAddress: this.fb.group({
        line1: [''],
        line2: [''],
        city: [''],
        postalCode: [''],  // , [Validators.pattern(postalRegex)]
        province: [{ value: 'British Columbia', disabled: false }],
        country: [{ value: 'Canada', disabled: false }],
      })
    });
  }

  // createCourtInfoItem(): FormGroup {
  //   return this.fb.group({
  //     courtFileNumber: '',
  //     courtLocation: ''
  //   });
  // }

  // createCrimeLocationItem(): FormGroup {
  //   return this.fb.group({
  //     location: ['', Validators.required]
  //   });
  // }

  // createPoliceReport(): FormGroup {
  //   return this.fb.group({
  //     policeFileNumber: '',
  //     investigatingOfficer: '',
  //     policeDetachment: '',
  //     reportStartDate: '',
  //     reportEndDate: '',
  //     policeReportedMultipleTimes: ['']
  //   });
  // }

  submitPartialApplication() {
    this.justiceDataService.submitApplication(this.harvestForm())
      .subscribe(
        data => {
          console.log("submitting partial form");
          this.router.navigate(['/application-success']);
        },
        err => {
          this.snackBar.open('Error submitting application', 'Fail', { duration: 3500, panelClass: ['red-snackbar'] });
          console.log('Error submitting application');
        }
      );
  }

  //submitPartialApplication() {
  //  this.formFullyValidated = true;
  //  this.save().subscribe(
  //    data => {
  //      console.log("submitting partial form");
  //      this.router.navigate(['/application-success']);
  //    },
  //    err => {
  //      this.snackBar.open('Error submitting application', 'Fail', { duration: 3500, panelClass: ['red-snackbar'] });
  //      console.log('Error submitting application');
  //    }
  //  );
  //}

  submitApplication() {
    //let formIsValid = true;showValidationMessage
    // show the button as submitting and disable it
    this.submitting = true;
    if (this.form.valid) {
      this.justiceDataService.submitApplication(this.harvestForm())
        .subscribe(
          data => {
            if (data['isSuccess'] == true) {
              this.router.navigate(['/application-success']);
            }
            else {
              // re-enable the button
              this.submitting = false;
              this.snackBar.open('Error submitting application. ' + data['message'], 'Fail', { duration: 3500, panelClass: ['red-snackbar'] });
              console.log('Error submitting application');
            }
          },
          error => {
            // re-enable the button
            this.submitting = false;
            this.snackBar.open('Error submitting application', 'Fail', { duration: 3500, panelClass: ['red-snackbar'] });
            console.log('Error submitting application');
          }
        );
    } else {
      // re-enable the button
      this.submitting = false;
      console.log("form not validated");
      this.markAsTouched();
    }
  }

  //submitApplication() {
  //  let formIsValid = this.form.valid;
  //  //let formIsValid = true;
  //  if (formIsValid) {
  //    this.formFullyValidated = true;
  //    this.save().subscribe(
  //      data => {
  //        if (data['IsSuccess'] == true) {
  //          console.log(data['IsSuccess']);
  //          console.log("submitting");
  //          this.router.navigate(['/application-success']);
  //        }
  //        else {
  //          this.snackBar.open('Error submitting application', 'Fail', { duration: 3500, panelClass: ['red-snackbar'] });
  //          console.log('Error submitting application');
  //        }
  //      },
  //      error => {
  //        this.snackBar.open('Error submitting application', 'Fail', { duration: 3500, panelClass: ['red-snackbar'] });
  //        console.log('Error submitting application');
  //      }
  //    );
  //  } else {
  //    console.log("form not validated");
  //    this.formFullyValidated = false;
  //    this.markAsTouched();
  //  }
  //}

  debugFormData(): void {
    let formData: Application = {
      Introduction: this.form.get('introduction').value,
      PersonalInformation: this.form.get('personalInformation').value,
      VictimInformation: this.form.get('victimInformation').value,
      CrimeInformation: this.form.get('crimeInformation').value,
      MedicalInformation: this.form.get('medicalInformation').value,
      ExpenseInformation: this.form.get('expenseInformation').value,
      EmploymentIncomeInformation: null,
      RepresentativeInformation: this.form.get('representativeInformation').value,
      DeclarationInformation: this.form.get('declarationInformation').value,
      AuthorizationInformation: this.form.get('authorizationInformation').value,
    };
    //console.log(formData);
    console.log(JSON.stringify(formData));
  }

  harvestForm(): Application {
    let data = {
      Introduction: this.form.get('introduction').value as Introduction,
      PersonalInformation: this.form.get('personalInformation').value as PersonalInformation,
      CrimeInformation: this.form.get('crimeInformation').value as CrimeInformation,
      MedicalInformation: this.form.get('medicalInformation').value as MedicalInformation,
      ExpenseInformation: this.form.get('expenseInformation').value as ExpenseInformation,
      EmploymentIncomeInformation: null as EmploymentIncomeInformation, // There is no EmploymentIncomeInformation in IFM
      RepresentativeInformation: this.form.get('representativeInformation').value as RepresentativeInformation,
      DeclarationInformation: this.form.get('declarationInformation').value as DeclarationInformation,
      AuthorizationInformation: this.form.get('authorizationInformation').value as AuthorizationInformation,
      VictimInformation: this.form.get('victimInformation').value as VictimInformation,
    } as Application;

    if (data.VictimInformation.mostRecentMailingAddressSameAsPersonal == true) {
      data.VictimInformation.primaryAddress = data.PersonalInformation.primaryAddress;
    }

    return data;
  }

  save(): void {
    this.justiceDataService.submitApplication(this.harvestForm())
      .subscribe(
        data => { },
        err => { }
      );
  }

  //save(): Subject<boolean> {
  //  const subResult = new Subject<boolean>();
  //  const formData: Application = {
  //    Introduction: this.form.get('introduction').value,
  //    PersonalInformation: this.form.get('personalInformation').value,
  //    VictimInformation: this.form.get('victimInformation').value,
  //    CrimeInformation: this.form.get('crimeInformation').value,
  //    MedicalInformation: this.form.get('medicalInformation').value,
  //    ExpenseInformation: this.form.get('expenseInformation').value,
  //    RepresentativeInformation: this.form.get('representativeInformation').value,
  //    DeclarationInformation: this.form.get('declarationInformation').value,
  //    AuthorizationInformation: this.form.get('authorizationInformation').value,
  //  };

  //  this.busy = this.justiceDataService.submitApplication(formData)
  //    .toPromise()
  //    .then(res => {
  //      subResult.next(true);
  //    }, err => subResult.next(false));
  //  this.busy2 = Promise.resolve(this.busy);

  //  return subResult;
  //}

  // marking the form as touched makes the validation messages show
  markAsTouched() {
    this.form.markAsTouched();
  }

  private buildApplicationForm(): FormGroup {
    return this.fb.group({
      introduction: this.fb.group({
        understoodInformation: ['', Validators.requiredTrue]
      }),
      personalInformation: this.personalInfoHelper.setupFormGroup(this.fb, this.FORM_TYPE),
      victimInformation: this.victimInfoHelper.setupFormGroup(this.fb, this.FORM_TYPE),
      crimeInformation: this.crimeInfoHelper.setupFormGroup(this.fb, this.FORM_TYPE),
      medicalInformation: this.medicalInfoHelper.setupFormGroup(this.fb, this.FORM_TYPE),
      expenseInformation: this.fb.group({
        haveCounsellingExpenses: [false],
        haveCounsellingTransportation: [false],
        havePrescriptionDrugExpenses: [false],

        // Additional Expenses
        haveVocationalServicesExpenses: [false],
        haveIncomeSupportExpenses: [false],
        haveChildcareExpenses: [false],
        haveLegalProceedingExpenses: [false],
        haveFuneralExpenses: [false],
        haveBereavementLeaveExpenses: [false],
        haveLostOfParentalGuidanceExpenses: [false],
        haveHomeMakerExpenses: [false],
        haveCrimeSceneCleaningExpenses: [false],
        noneOfTheAboveExpenses: [''],

        missedWorkDueToDeathOfVictim: [''],//, Validators.required],

        didYouLoseWages: [''], //, Validators.required],
        daysWorkMissedStart: [''], //, Validators.required],
        daysWorkMissedEnd: [''],

        employers: this.fb.array([this.createEmployerItem()]),
        mayContactEmployer: [''],

        additionalBenefitsDetails: [''],//, Validators.required], ??

        // Other Benefits
        haveDisabilityPlanBenefits: [false],
        haveEmploymentInsuranceBenefits: [false],
        haveIncomeAssistanceBenefits: [false],
        haveCanadaPensionPlanBenefits: [false],
        haveAboriginalAffairsAndNorthernDevelopmentCanadaBenefits: [false],
        haveCivilActionBenefits: [false],
        haveOtherBenefits: [false],
        otherSpecificBenefits: [''],
        noneOfTheAboveBenefits: [false],
      }),

      representativeInformation: this.representativeInfoHelper.setupFormGroup(this.fb, this.FORM_TYPE),

      declarationInformation: this.fb.group({
        declaredAndSigned: ['', Validators.requiredTrue],
        signature: ['', Validators.required],
      }),

      authorizationInformation: this.authInfoHelper.setupFormGroup(this.fb, this.FORM_TYPE),
    });
  }

  // setRequiredFields() {
  //   // set all form validation
  //   // this.setCompletingOnBehalfOf();
  //   // this.setCvapStaffSharing();
  //   // this.setHospitalTreatment();
  //   // this.setPreferredContactMethod();
  //   this.setRepresentativePreferredMethodOfContact();
  // }

  // setRepresentativePreferredMethodOfContact(): void {
  //   // TODO: this responseCode is a string for some reason in the form instead of a number. Why?
  //   const responseCode: number = parseInt(this.form.get('representativeInformation.representativePreferredMethodOfContact').value);
  //   if (typeof responseCode != 'number') console.log('Set representative preferred contact method should be a number but is not for some reason. ' + typeof responseCode);
  //   let options = { onlySelf: true, emitEvent: false };
  //   let phoneControl = this.form.get('representativeInformation.representativePhoneNumber');
  //   let emailControl = this.form.get('representativeInformation.representativeEmail');
  //   let addressControls = [
  //     this.form.get('representativeInformation').get('representativeAddress.country'),
  //     this.form.get('representativeInformation').get('representativeAddress.province'),
  //     this.form.get('representativeInformation').get('representativeAddress.city'),
  //     this.form.get('representativeInformation').get('representativeAddress.line1'),
  //     this.form.get('representativeInformation').get('representativeAddress.postalCode'),
  //   ];

  //   phoneControl.clearValidators();
  //   phoneControl.setErrors(null);
  //   emailControl.clearValidators();
  //   emailControl.setErrors(null);
  //   for (let control of addressControls) {
  //     control.clearValidators();
  //     control.setErrors(null);
  //   }

  //   if (responseCode === 100000000) {
  //     phoneControl.setValidators([Validators.required, Validators.minLength(10), Validators.maxLength(10)]);
  //     this.representativePhoneIsRequired = true;
  //     this.representativeEmailIsRequired = false;
  //     // this.representativeAddressIsRequired = true;
  //   } else if (responseCode === 100000001) {
  //     emailControl.setValidators([Validators.required, Validators.email]);
  //     this.representativePhoneIsRequired = false;
  //     this.representativeEmailIsRequired = true;
  //     // this.representativeAddressIsRequired = true;
  //   } else if (responseCode === 100000002) {
  //     // for (let control of addressControls) {
  //     //   control.setValidators([Validators.required]);
  //     // }
  //     this.representativePhoneIsRequired = false;
  //     this.representativeEmailIsRequired = false;
  //     // this.representativeAddressIsRequired = true;
  //   }

  //   for (let control of addressControls) {
  //     control.setValidators([Validators.required]);
  //   }
  //   this.representativeAddressIsRequired = true;

  //   // phoneControl.markAsTouched();
  //   phoneControl.updateValueAndValidity(options);
  //   // emailControl.markAsTouched();
  //   emailControl.updateValueAndValidity(options);
  //   for (let control of addressControls) {
  //     // control.markAsTouched();
  //     control.updateValueAndValidity(options);
  //   }
  // }

  // onRepresentativeFileBundle(fileBundle: FileBundle) {
  //   try {
  //     if (fileBundle.fileData && fileBundle.fileData.length > 0) {
  //       this.showLegalGuardianDocumentDescription = true;
  //     }
  //     else {
  //       this.showLegalGuardianDocumentDescription = false;
  //     }
  //     // save the files submitted from the component for attachment into the submitted form.
  //     const patchObject = {};
  //     patchObject['representativeInformation.legalGuardianFiles'] = fileBundle;

  //     let fileName = fileBundle.fileName[0] || "";
  //     this.form.get('representativeInformation.legalGuardianFiles.filename').patchValue(fileName);

  //     let body = fileBundle.fileData.length > 0 ? fileBundle.fileData[0].split(',')[1] : "";
  //     this.form.get('representativeInformation.legalGuardianFiles.body').patchValue(body);
  //   }
  //   catch (e) {
  //     console.log(e);
  //   }
  // }
}
