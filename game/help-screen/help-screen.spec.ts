import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HelpScreen } from './help-screen';

describe('HelpScreen', () => {
  let component: HelpScreen;
  let fixture: ComponentFixture<HelpScreen>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelpScreen]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HelpScreen);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
