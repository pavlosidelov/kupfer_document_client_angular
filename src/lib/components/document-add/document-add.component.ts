import { Component, OnInit, Input, ViewChild, OnDestroy, OnChanges } from '@angular/core';
import { Subject } from 'rxjs';
import { Subscription } from 'rxjs';
import * as moment from 'moment';
import { DocumentFormComponent } from './../document-form/document-form.component';
import { OAuthService } from '@libs/midgard-angular/src/lib/modules/oauth/oauth.service';
import { select, Store } from '@libs/midgard-angular/src/lib/modules/store/store';
import { MatSnackBar } from '@angular/material';
import { createDocument } from '@libs/documents/src/lib/state/documents.actions';
import { getDocumentsLoaded } from '@libs/documents/src/lib/state/documents.selectors';

@Component({
  selector: 'mg-document-add',
  templateUrl: './document-add.component.html',
  styleUrls: ['./document-add.component.scss']
})
export class DocumentAddComponent implements OnInit, OnDestroy {

  @ViewChild(DocumentFormComponent) documentForm: DocumentFormComponent;
  @Input() currentWorkflowLevel2;
  @Input() userSelectOptions;
  @Input() projectSelectOptions;
  @Input() selectedContact = {};
  @Input() modal: Subject<any> = new Subject();
  @Input() currentContactUuuid;
  @Input() currentDocument;
  @Input() contactUiid;
  public showButtonSpinner = false;
  public selectedOauthUser: any = {};
  public isFileSelected = false;
  public file: any;
  public fileData: any;
  public removeFile;
  public noFileSelected = false;
  public createDocumentAdded;
  private createDocumentSubscription: Subscription;

  constructor(
    private authService: OAuthService,
    private store: Store<any>,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    const oauthUser = this.authService.getOauthUser();
    this.selectedOauthUser = {
      label: oauthUser.core_user.name,
      value: oauthUser.core_user.core_user_uuid
    };
  }

  /**
   * Submit form data
   */
  public onFormSubmit(documentFormObject) {
    if (!this.fileData) {
      this.noFileSelected = true;
      this.snackBar.open('Select or Drag a file to upload', 'close', {
        duration: 2000,
      });
    } else {
      this.showButtonSpinner = true;
      documentFormObject.file = this.fileData;
      documentFormObject.create_date = moment(documentFormObject.create_date, 'DD.MM.YYYY').format(
        'YYYY-MM-DDThh:mm:ssZ'
      );
      this.store.dispatch(createDocument(documentFormObject));
      this.createDocumentAdded = this.store.observable.pipe(select(getDocumentsLoaded));
      this.createDocumentSubscription = this.createDocumentAdded.subscribe((uploaded: boolean) => {
        if (!uploaded) {
          this.modal.next('close');
          this.clearFile(documentFormObject);
        }
      });
    }
  }

  /**
   * sets remove file to the value passed
   * @param {boolean} remove - remove file
   */
  public clearFile(remove) {
    this.removeFile = remove;
    this.cancelUploaded();
    this.showButtonSpinner = false;
    // this.documentForm.formSubmited = false;
  }

  /**
   * @description - set the uploaded file name
   * @param {object} file - file object
   */
  public setFileName(file) {
    if (file) {
      this.file = file;
    }
  }

  /**
   * set File data to upload
   * @param {string} data - file local base64 path
   */
  public setFileData(data) {
    if (this.file) {
      this.fileData = data;
      this.isFileSelected = true;
    }
  }

  /**
   * cancel upload reset file variables
   * reset the form
   * toggles variable for hidding preview block
   */
  public cancelUploaded() {
    this.showButtonSpinner = false;
    this.isFileSelected = false;
    this.fileData = '';
    this.file = '';
    if (this.documentForm) {
      this.documentForm.resetForm();
    }
  }

  /**
   * Unsubscribe used subscriptions on destroying the component
   */
  ngOnDestroy() {
    if (this.createDocumentSubscription) {
      this.createDocumentSubscription.unsubscribe();
    }
  }

}